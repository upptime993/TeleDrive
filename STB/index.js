import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import busboy from 'busboy';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65');
  next();
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 🛡️ SECURITY: Validasi akses ke worker menggunakan HMAC token.
// Token di-generate oleh Next.js server (/api/worker-info) dan dikirim
// ke browser. Browser mengirim token ini ke STB via header x-worker-token.
// STB memvalidasi HMAC signature + timestamp expiry.
//
// Ini LEBIH AMAN daripada mengirim WORKER_SECRET mentah ke browser karena:
//   1. Token bersifat time-limited (2 jam)
//   2. Secret tidak pernah keluar dari server
//   3. Token yang expired otomatis ditolak
//
// Backward-compatible: masih menerima x-worker-secret langsung (dari
// Next.js server-side calls yang sudah ada) agar tidak breaking.
const WORKER_SECRET = process.env.WORKER_SECRET || 'rahasia_bersama_12345';
const TOKEN_TTL_SEC = 2 * 60 * 60; // 2 jam — sama dengan di worker-info route

function validateWorkerAuth(req, res, next) {
  if (!WORKER_SECRET) return next(); // Dev mode: skip jika tidak ada secret

  // Method 1: Direct secret (dari Next.js server → STB, backward-compat)
  const directSecret = req.headers['x-worker-secret'];
  if (directSecret && directSecret === WORKER_SECRET) {
    return next();
  }

  // Method 2: HMAC token (dari browser → STB)
  const token = req.headers['x-worker-token'];
  if (token) {
    const [timestampStr, hmacProvided] = String(token).split('.');
    if (timestampStr && hmacProvided) {
      const timestamp = parseInt(timestampStr, 10);
      const now = Math.floor(Date.now() / 1000);
      // Cek token belum expired
      if (!isNaN(timestamp) && (now - timestamp) <= TOKEN_TTL_SEC) {
        const expectedHmac = crypto.createHmac('sha256', WORKER_SECRET)
          .update(timestampStr).digest('hex');
        if (crypto.timingSafeEqual(Buffer.from(hmacProvided, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
          return next();
        }
      }
    }
  }

  return res.status(403).json({ error: 'Forbidden: invalid or expired token' });
}

// Apply auth ke semua route kecuali /health
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  validateWorkerAuth(req, res, next);
});

// ─── Telegram Client ──────────────────────────────────────────
const client = new TelegramClient(
  new StringSession(process.env.TELEGRAM_SESSION || ''),
  Number(process.env.TELEGRAM_API_ID),
  process.env.TELEGRAM_API_HASH,
  {
    connectionRetries: 10,
    retryDelay: 2000,
    autoReconnect: true,
    useWSS: false,
  }
);

let telegramReady = false;

async function connectTelegram() {
  try {
    await client.connect();
    telegramReady = true;
    console.log('[Telegram] Terhubung!');
  } catch (err) {
    telegramReady = false;
    console.error('[Telegram] Gagal konek:', err.message);
    setTimeout(connectTelegram, 5000);
  }
}

await connectTelegram();

// ─── Busboy Multipart Parser ──────────────────────────────────
// Limit 20MB per chunk — sesuai batas maksimal Telegram per pesan
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let fileBuffer = null;
    let fileName = null;

    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: 20 * 1024 * 1024 },
    });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('file', (name, stream, info) => {
      fileName = info.filename;
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
      stream.on('error', reject);
    });

    bb.on('finish', () => {
      resolve({ fields, fileBuffer, fileName });
    });

    bb.on('error', reject);
    req.pipe(bb);
  });
}

// ─── Helper: Download 1 chunk dengan retry ───────────────────
async function downloadChunkWithRetry(id, maxRetries = 3) {
  let lastErr = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const messages = await client.getMessages('me', { ids: [id] });
      const msg = messages?.[0];
      if (!msg?.media) throw new Error(`msgId=${id} tidak ada media`);
      const buffer = await client.downloadMedia(msg.media, { workers: 3 });
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
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    workerId: process.env.WORKER_ID || 'worker-1',
    uptime: process.uptime(),
    telegramReady,
  });
});

// ─── Upload chunk ─────────────────────────────────────────────
app.post('/upload-chunk', async (req, res) => {
  try {
    if (!telegramReady) {
      return res.status(503).json({ error: 'Telegram belum terhubung, coba lagi' });
    }

    const { fields, fileBuffer, fileName: origName } = await parseMultipart(req);

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Tidak ada chunk yang diterima' });
    }

    const { part, totalParts, fileName } = fields;
    const name = fileName || origName || 'unknown';

    if (part === undefined || !totalParts) {
      return res.status(400).json({ error: 'Field wajib: part, totalParts, fileName' });
    }

    console.log(`[upload-chunk] Menerima part=${part}/${totalParts} size=${fileBuffer.length} file=${name}`);

    const result = await client.sendFile('me', {
      file: fileBuffer,
      caption: `TeleDrive|chunk|part=${part}|total=${totalParts}|name=${name}`,
      forceDocument: true,
      workers: 3,
      attributes: [],
    });

    console.log(`[upload-chunk] SUKSES part=${part}/${totalParts} msgId=${result.id}`);
    res.json({ success: true, msgId: result.id, part: parseInt(part), size: fileBuffer.length });

  } catch (err) {
    console.error('[upload-chunk] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload file kecil ────────────────────────────────────────
app.post('/upload', async (req, res) => {
  try {
    if (!telegramReady) {
      return res.status(503).json({ error: 'Telegram belum terhubung, coba lagi' });
    }

    const { fileBuffer, fileName: origName } = await parseMultipart(req);

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diterima' });
    }

    const fileName = origName || 'unknown';
    console.log(`[upload] Menerima file=${fileName} size=${fileBuffer.length}`);

    const result = await client.sendFile('me', {
      file: fileBuffer,
      caption: `TeleDrive|single|name=${fileName}`,
      forceDocument: true,
      workers: 3,
    });

    console.log(`[upload] SUKSES fileName=${fileName} msgId=${result.id}`);
    res.json({ success: true, msgId: result.id, size: fileBuffer.length });

  } catch (err) {
    console.error('[upload] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Download 1 file/chunk ────────────────────────────────────
app.get('/download', async (req, res) => {
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
// Sebelumnya: sequential (1 chunk → tunggu → 1 chunk → tunggu)
// Sekarang  : paralel batch (DOWNLOAD_CONCURRENCY chunk sekaligus)
//             kemudian write ke response dalam urutan yang benar
//
// Contoh dengan 25 chunk dan DOWNLOAD_CONCURRENCY=5:
//   Batch 1: download chunk 0-4 paralel → write 0,1,2,3,4
//   Batch 2: download chunk 5-9 paralel → write 5,6,7,8,9
//   ...dst
// Speedup: ~5× lebih cepat dibanding sequential
//
const DOWNLOAD_CONCURRENCY = 5;

app.get('/download-chunked', async (req, res) => {
  try {
    const { msgIds, fileName, mimeType, fileSize } = req.query;
    if (!msgIds) return res.status(400).json({ error: 'msgIds wajib diisi' });

    const ids = String(msgIds)
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    if (ids.length === 0) return res.status(400).json({ error: 'msgIds tidak valid' });

    console.log(`[download-chunked] ${ids.length} chunks untuk "${fileName}" — concurrency=${DOWNLOAD_CONCURRENCY}`);

    // Set headers sebelum mulai streaming
    res.set({
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || 'file')}"`,
      'Transfer-Encoding': 'chunked',
    });
    if (fileSize) res.set('Content-Length', fileSize);

    // Proses dalam batch agar urutan chunk terjaga
    // Setiap batch: download DOWNLOAD_CONCURRENCY chunk secara paralel,
    // lalu write ke response dalam urutan yang benar
    for (let batchStart = 0; batchStart < ids.length; batchStart += DOWNLOAD_CONCURRENCY) {
      const batchIds = ids.slice(batchStart, batchStart + DOWNLOAD_CONCURRENCY);

      // Download semua chunk dalam batch ini secara paralel
      const batchBuffers = await Promise.allSettled(
        batchIds.map(id => downloadChunkWithRetry(id))
      );

      // Write hasil ke response dalam urutan yang benar
      for (let j = 0; j < batchBuffers.length; j++) {
        const result = batchBuffers[j];
        const chunkIdx = batchStart + j;
        if (result.status === 'fulfilled' && result.value) {
          res.write(result.value);
          console.log(`[download-chunked] ✓ chunk[${chunkIdx}] msgId=${batchIds[j]} (${result.value.length} bytes)`);
        } else {
          // Chunk gagal setelah semua retry — log error tapi lanjutkan
          // agar client tidak hang (file mungkin corrupt tapi tetap terkirim)
          console.error(`[download-chunked] ✗ chunk[${chunkIdx}] msgId=${batchIds[j]} GAGAL:`, result.reason?.message);
        }
      }
    }

    res.end();
    console.log(`[download-chunked] Selesai streaming "${fileName}"`);

  } catch (err) {
    console.error('[download-chunked] ERROR:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

// ─── Delete messages dari Telegram ───────────────────────────
app.delete('/delete', async (req, res) => {
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

// ─── Juga terima DELETE dengan body via POST /delete ──────────
// (backward compat untuk client yang pakai POST)
app.post('/delete', async (req, res) => {
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
app.listen(PORT, () => console.log(`[Worker] Running on port ${PORT} | workerId=${process.env.WORKER_ID || 'worker-1'}`));
