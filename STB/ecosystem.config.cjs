/**
 * ecosystem.config.cjs — Multi-Worker TeleDrive STB
 *
 * ATURAN PENTING (Telegram Session):
 *   - Setiap worker HARUS menggunakan Session String yang BERBEDA
 *   - Session yang sama di 2+ worker AKAN menyebabkan disconnect/konflik
 *
 * CARA GENERATE SESSION BARU untuk worker-2 / worker-3:
 *   node gen-session.mjs
 *   → Login dengan nomor HP yang sama, pilih perangkat berbeda
 *   → Salin string panjang yang dihasilkan ke SESSION_B / SESSION_C di bawah
 *
 * CARA PAKAI:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 *
 * CARA LIHAT LOG:
 *   pm2 logs worker-1
 *   pm2 monit
 */

// ──────────────────────────────────────────────────────────────
// KONFIGURASI — Edit bagian ini sesuai akun Telegram kamu
// ──────────────────────────────────────────────────────────────
const API_ID   = '35692704';
const API_HASH = 'e0e5eeb0ebe768c1c8ac55f2d15b0422';
const WORKER_SECRET = 'rahasia_bersama_12345';

// SESSION_A = session dari .env (worker utama)
const SESSION_A = '1BQANOTEuMTA4LjU2LjE5MQG7JQnL9giYGnnm+Ht13InkTwH3nTXDTgFHHDQp2Hen3QSb0bXnwPbt0wJK3FBjwdcDIY2nA/QDfp8c76D4e0d8RcjYb0DI9DNOeXylpICRdEVXA1zp6pg7LnHohBIfe7TthAZLQdJnhKKN8zjjQ9frZN426kmV0T6E6/fA99nEVqd0HbCZEtLTWbKXKRbq/nKXywttYwMEmibqmVaJHq44wcVEPBlG9yWI3qhk2hxKMOGh4/cNEG2pBDVAJ6oUcghxylPj96XmCY1vwGygU4/L4G29lXj6ICr/RmWGJujcaCfY6lOljcEGLjQzxWher9nWUxO6qzxzMi4dx8XznOObwQ==';

// SESSION_B = HARUS session BERBEDA dari SESSION_A
// Jalankan: node gen-session.mjs  lalu paste hasilnya di sini
// JANGAN copy-paste SESSION_A ke sini — akan menyebabkan konflik koneksi!
const SESSION_B = 'GANTI_DENGAN_SESSION_BARU_DARI_gen-session.mjs';

// SESSION_C = session ke-3 (opsional, hanya jika RAM > 800MB)
// const SESSION_C = 'GANTI_DENGAN_SESSION_KETIGA';

module.exports = {
  apps: [
    {
      name: 'worker-1',
      script: '/root/teledrive-worker/index.js',
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        WORKER_ID: 'worker-1',
        TELEGRAM_API_ID: API_ID,
        TELEGRAM_API_HASH: API_HASH,
        WORKER_SECRET,
        TELEGRAM_SESSION: SESSION_A,
      },
      max_memory_restart: '400M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'worker-2',
      script: '/root/teledrive-worker/index.js',
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        WORKER_ID: 'worker-2',
        TELEGRAM_API_ID: API_ID,
        TELEGRAM_API_HASH: API_HASH,
        WORKER_SECRET,
        TELEGRAM_SESSION: SESSION_B,  // ← HARUS berbeda dari SESSION_A!
      },
      max_memory_restart: '400M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    // Worker 3 — aktifkan jika RAM > 800MB DAN sudah generate SESSION_C
    // {
    //   name: 'worker-3',
    //   script: '/root/teledrive-worker/index.js',
    //   interpreter: 'node',
    //   interpreter_args: '--experimental-vm-modules',
    //   env: {
    //     NODE_ENV: 'production',
    //     PORT: 3002,
    //     WORKER_ID: 'worker-3',
    //     TELEGRAM_API_ID: API_ID,
    //     TELEGRAM_API_HASH: API_HASH,
    //     WORKER_SECRET,
    //     TELEGRAM_SESSION: SESSION_C,  // ← HARUS berbeda dari SESSION_A dan SESSION_B!
    //   },
    //   max_memory_restart: '400M',
    //   restart_delay: 3000,
    //   exp_backoff_restart_delay: 100,
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // },
  ],
};
