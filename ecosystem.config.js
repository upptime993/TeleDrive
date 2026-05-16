/**
 * PM2 Ecosystem Config — TeleDrive Multi-Worker (1 STB, 4 proses)
 *
 * CARA PAKAI:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup   ← biar auto-start waktu STB reboot
 *
 * CARA STOP SEMUA:
 *   pm2 stop all
 *
 * CARA LIHAT LOG:
 *   pm2 logs
 *   pm2 logs worker-1   ← log spesifik 1 worker
 *
 * ENV VARS — bisa di-set langsung di sini atau pakai file .env per worker.
 * Ganti nilai TELEGRAM_SESSION, TELEGRAM_API_ID, TELEGRAM_API_HASH sesuai akun lo.
 *
 * Catatan RAM (estimasi):
 *   4 worker × ~180MB = ~720MB
 *   Sisa OS + Node overhead ≈ 300MB
 *   Total kebutuhan ≈ 1GB — pas untuk STB 1-2GB RAM
 */

const BASE_ENV = {
  NODE_ENV: 'production',
  TELEGRAM_API_ID: process.env.TELEGRAM_API_ID || 'ISI_API_ID_LO',
  TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH || 'ISI_API_HASH_LO',
  TELEGRAM_SESSION: process.env.TELEGRAM_SESSION || 'ISI_SESSION_STRING_LO',
  WORKER_SECRET: process.env.WORKER_SECRET || 'ISI_SECRET_BERSAMA_LO',
}

module.exports = {
  apps: [
    {
      name: 'worker-1',
      script: 'worker-index-final.js',
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        ...BASE_ENV,
        PORT: 3000,
        WORKER_ID: 'worker-1',
      },
      max_memory_restart: '400M',   // restart otomatis jika RAM > 400MB
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'worker-2',
      script: 'worker-index-final.js',
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        ...BASE_ENV,
        PORT: 3001,
        WORKER_ID: 'worker-2',
      },
      max_memory_restart: '400M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'worker-3',
      script: 'worker-index-final.js',
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        ...BASE_ENV,
        PORT: 3002,
        WORKER_ID: 'worker-3',
      },
      max_memory_restart: '400M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    // Worker 4 — aktifkan hanya jika RAM STB > 1.5GB
    // Kalau RAM pas-pasan, comment block ini
    {
      name: 'worker-4',
      script: 'worker-index-final.js',
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        ...BASE_ENV,
        PORT: 3003,
        WORKER_ID: 'worker-4',
      },
      max_memory_restart: '400M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
