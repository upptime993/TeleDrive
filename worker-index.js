import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65');
  next();
});

// [FIX] CORS: Izinkan semua origin. Keamanan dijamin oleh requireSecret (WORKER_SECRET).
// Hal ini karena browser client di Vercel harus bisa POST file langsung ke Cloudflare Tunnel (STB).
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-worker-secret']
}));
app.use(express.json({ limit: '1mb' }));

// ─── Worker Auth Middleware ───────────────────────────────────
const WORKER_SECRET = process.env.WORKER_SECRET || '';

function requireSecret(req, res, next) {
  // Terima secret dari header x-worker-secret (digunakan oleh Next.js API routes)
  // atau dari query param _ws (backward-compat, hanya untuk kasus tertentu)
  if (!WORKER_SECRET) return next();
  const headerSecret = req.headers['x-worker-secret'] || req.query._ws;
  if (headerSecret !== WORKER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid worker secret' });
  }
  return next();
}

// ─── Rate Limiter ─────────────────────────────────────────────
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_LIMIT_WINDOW_MS; }
  entry.count++;
  requestCounts.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too Many Requests. Coba lagi dalam 1 menit.' });
  }
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.reset) requestCounts.delete(ip);
  }
}, 60_000);

// ─── Telegram Client ─────────────────────────────────────────
const client = new TelegramClient(
  new StringSession(process.env.TELEGRAM_SESSION || ''),
  Number(process.env.TELEGRAM_API_ID),
  process.env.TELEGRAM_API_HASH,
  { connectionRetries: 5, retryDelay: 1000, autoReconnect: true, useWSS: false }
);

await client.connect();
console.log('Telegram connected!');

// ─── Helper: Download 1 chunk dengan retry ───────────────────
async function downloadChunkWithRetry(id, maxRetries = 3) {
  let lastErr = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const messages = await client.getMessages('me', { ids: [id] });
      const msg = messages && messages.length > 0 ? messages[0] : null;
      if (!msg || !msg.media) throw new Error(`msgId=${id} tidak ada media`);
      const buffer = await client.downloadMedia(msg.media, {});
      if (!buffer || buffer.length === 0) throw new Error(`Buffer kosong untuk msgId=${id}`);
      return buffer;
    } catch (e) {
      lastErr = e;
      console.error(`[downloadChunk] Retry ${attempt + 1}/${maxRetries} msgId=${id}: ${e.message}`);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── Upload chunk ─────────────────────────────────────────────
app.post('/upload-chunk', rateLimit, requireSecret, upload.single('chunk'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Tidak ada chunk yang diterima' });
    const { part, totalParts, fileName } = req.body;
    if (part === undefined || !totalParts || !fileName) {
      return res.status(400).json({ error: 'Field wajib: part, totalParts, fileName' });
    }
    const buffer = req.file.buffer;
    const result = await client.sendFile('me', {
      file: buffer,
      caption: `TeleDrive|chunk|part=${part}|total=${totalParts}|name=${fileName}`,
      forceDocument: true,
      attributes: [],
    });
    console.log(`[upload-chunk] part=${part}/${totalParts} msgId=${result.id}`);
    res.json({ success: true, msgId: result.id, part: parseInt(part), size: buffer.length });
  } catch (err) {
    console.error('[upload-chunk] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload file kecil ────────────────────────────────────────
app.post('/upload', rateLimit, requireSecret, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diterima' });
    const buffer = req.file.buffer;
    const fileName = req.file.originalname;
    const result = await client.sendFile('me', {
      file: buffer,
      caption: `TeleDrive|single|name=${fileName}`,
      forceDocument: true,
    });
    console.log(`[upload] fileName=${fileName} msgId=${result.id}`);
    res.json({ success: true, msgId: result.id, size: buffer.length });
  } catch (err) {
    console.error('[upload] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Download single ──────────────────────────────────────────
app.get('/download', requireSecret, async (req, res) => {
  try {
    const { msgId, fileName, mimeType } = req.query;
    if (!msgId) return res.status(400).json({ error: 'msgId wajib diisi' });
    const id = parseInt(String(msgId).trim());
    if (isNaN(id)) return res.status(400).json({ error: 'msgId tidak valid' });
    console.log(`[download] Fetching msgId=${id}`);

    const buffer = await downloadChunkWithRetry(id);

    console.log(`[download] msgId=${id} size=${buffer.length} bytes OK`);
    res.set({
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || 'file')}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    console.error('[download] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Download chunked — PARALEL dengan ordered streaming ──────
//
// Sebelumnya: sequential (1 chunk → tunggu → chunk berikutnya)
// Sekarang  : batch paralel (DOWNLOAD_CONCURRENCY chunk sekaligus)
//             Write ke response dalam urutan yang BENAR (chunk 0, 1, 2, ...)
//
// Contoh: 25 chunk, CONCURRENCY=5
//   Batch 1: download chunk 0-4 secara paralel → write 0,1,2,3,4
//   Batch 2: download chunk 5-9 secara paralel → write 5,6,7,8,9
//   ... dst → ~5× lebih cepat dari sequential
//
const DOWNLOAD_CONCURRENCY = 5;

app.get('/download-chunked', requireSecret, async (req, res) => {
  try {
    const { msgIds, fileName, mimeType, fileSize } = req.query;
    if (!msgIds) return res.status(400).json({ error: 'msgIds wajib diisi' });
    const ids = String(msgIds).split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!ids.length) return res.status(400).json({ error: 'msgIds tidak valid' });

    console.log(`[download-chunked] ${ids.length} chunks — concurrency=${DOWNLOAD_CONCURRENCY}`);

    // [FIX PERF] Batch fetch semua message metadata sekaligus di awal
    // untuk mengurangi jumlah round-trip getMessages
    const allMessages = await client.getMessages('me', { ids });
    const messageMap = new Map();
    if (allMessages && allMessages.length > 0) {
      allMessages.forEach(m => messageMap.set(m.id, m));
    }

    // Validasi semua chunk tersedia SEBELUM mulai streaming
    // Jika ada yang hilang → return error JSON (header belum dikirim)
    for (const id of ids) {
      const msg = messageMap.get(id);
      if (!msg || !msg.media) {
        return res.status(404).json({ error: `Chunk msgId=${id} tidak ditemukan di Telegram` });
      }
    }

    // Semua chunk valid → aman mulai streaming
    const headers = {
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || 'file')}"`,
      'Transfer-Encoding': 'chunked',
    };
    if (fileSize) headers['Content-Length'] = fileSize;
    res.set(headers);


    // Download dan stream dalam batch paralel (ordered)
    for (let batchStart = 0; batchStart < ids.length; batchStart += DOWNLOAD_CONCURRENCY) {
      const batchIds = ids.slice(batchStart, batchStart + DOWNLOAD_CONCURRENCY);

      // Download semua chunk dalam batch ini secara paralel
      const batchResults = await Promise.allSettled(
        batchIds.map(id => {
          const msg = messageMap.get(id);
          return client.downloadMedia(msg.media, {});
        })
      );

      // Write ke response dalam urutan yang benar
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const chunkIdx = batchStart + j;
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          res.write(result.value);
          console.log(`[download-chunked] ✓ chunk[${chunkIdx}] msgId=${batchIds[j]} (${result.value.length} bytes)`);
        } else {
          console.error(`[download-chunked] ✗ chunk[${chunkIdx}] msgId=${batchIds[j]} GAGAL:`, result.reason?.message || 'buffer kosong');
        }
      }
    }

    res.end();
    console.log(`[download-chunked] Selesai streaming "${fileName}"`);
  } catch (err) {
    console.error('[download-chunked] ERROR:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.socket?.destroy(err);
  }
});

// ─── Delete messages dari Telegram ───────────────────────────
app.post('/delete', requireSecret, async (req, res) => {
  try {
    const { msgIds } = req.body;
    if (!msgIds || !Array.isArray(msgIds) || msgIds.length === 0) {
      return res.status(400).json({ error: 'msgIds wajib diisi sebagai array' });
    }
    const validIds = msgIds.filter(id => typeof id === 'number' && !isNaN(id));
    if (!validIds.length) return res.status(400).json({ error: 'Tidak ada msgId yang valid' });
    console.log(`[delete] Menghapus ${validIds.length} pesan dari Telegram`);
    await client.deleteMessages('me', validIds, { revoke: true });
    console.log(`[delete] ${validIds.length} pesan berhasil dihapus`);
    res.json({ success: true, deleted: validIds.length });
  } catch (err) {
    console.error('[delete] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Worker running on port ${PORT}`));
