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

const allowedOrigin = process.env.NEXTAUTH_URL;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json({ limit: '1mb' }));

// ─── Worker Auth Middleware ───────────────────────────────────
const WORKER_SECRET = process.env.WORKER_SECRET || '';

function requireSecret(req, res, next) {
  // Also accept secret from query param (for redirect-based downloads)
  const querySecret = req.query._ws;
  if (!WORKER_SECRET) return next();
  const headerSecret = req.headers["x-worker-secret"] || querySecret;
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
    const messages = await client.getMessages('me', { ids: [id] });
    const msg = messages && messages.length > 0 ? messages[0] : null;
    if (!msg || !msg.media) {
      return res.status(404).json({ error: `File msgId=${id} tidak ditemukan di Telegram` });
    }
    const buffer = await client.downloadMedia(msg.media, {});
    if (!buffer || buffer.length === 0) {
      return res.status(500).json({ error: 'Download dari Telegram menghasilkan buffer kosong' });
    }
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

// ─── Download chunked ─────────────────────────────────────────
app.get('/download-chunked', requireSecret, async (req, res) => {
  try {
    const { msgIds, fileName, mimeType, fileSize } = req.query;
    if (!msgIds) return res.status(400).json({ error: 'msgIds wajib diisi' });
    const ids = String(msgIds).split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!ids.length) return res.status(400).json({ error: 'msgIds tidak valid' });
    console.log(`[download-chunked] Fetching ${ids.length} chunks`);
    res.set({
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || 'file')}"`,
    });
    if (fileSize) res.set('Content-Length', fileSize);
    
    // Pre-fetch all messages to avoid N+1 bottleneck
    const messages = await client.getMessages('me', { ids });
    const messageMap = new Map();
    if (messages && messages.length > 0) {
      messages.forEach(m => messageMap.set(m.id, m));
    }

    for (const id of ids) {
      const msg = messageMap.get(id);
      if (!msg || !msg.media) {
        console.error(`[download-chunked] Chunk msgId=${id} tidak ditemukan`);
        if (!res.headersSent) return res.status(404).json({ error: `Chunk msgId=${id} tidak ditemukan` });
        res.socket.destroy(new Error(`Chunk msgId=${id} tidak ditemukan`));
        break;
      }
      const buffer = await client.downloadMedia(msg.media, {});
      if (!buffer || buffer.length === 0) { 
        console.error(`[download-chunked] Chunk msgId=${id} buffer kosong`); 
        if (!res.headersSent) return res.status(404).json({ error: `Chunk msgId=${id} buffer kosong` });
        res.socket.destroy(new Error(`Chunk msgId=${id} buffer kosong`));
        break; 
      }
      res.write(buffer);
      console.log(`[download-chunked] Chunk msgId=${id} size=${buffer.length} OK`);
    }
    res.end();
  } catch (err) {
    console.error('[download-chunked] ERROR:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.socket.destroy(err);
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
