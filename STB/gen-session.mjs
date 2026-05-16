/**
 * gen-session.mjs — Generate Telegram Session String baru
 *
 * PENTING: API_ID dan API_HASH HARUS sama dengan yang dipakai di worker!
 * Jika session dihasilkan dengan API_ID berbeda, session TIDAK AKAN BISA
 * dipakai di worker (error AUTH_KEY_UNREGISTERED).
 *
 * CARA PAKAI:
 *   node gen-session.mjs
 *
 * CATATAN NOMOR HP:
 *   - Format: +62xxxxxxxxx (tanpa spasi, tanpa backslash)
 *   - Contoh BENAR : +6281774954863
 *   - Contoh SALAH : +6281774954863\  ← jangan ada backslash!
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import * as readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, (ans) => resolve(ans.trim())));

// !! HARUS SAMA dengan API_ID dan API_HASH di ecosystem.config.cjs !!
const apiId   = 35692704;
const apiHash = 'e0e5eeb0ebe768c1c8ac55f2d15b0422';

console.log(`\n=== TeleDrive Session Generator ===`);
console.log(`API ID   : ${apiId}`);
console.log(`API HASH : ${apiHash.slice(0, 8)}...`);
console.log(`===================================\n`);

const client = new TelegramClient(
  new StringSession(''),
  apiId,
  apiHash,
  { connectionRetries: 5 }
);

await client.start({
  phoneNumber: async () => {
    const num = await ask('Nomor HP (format +62xxx, tanpa backslash): ');
    // Bersihkan karakter tidak valid
    return num.replace(/[^\d+]/g, '');
  },
  password: async () => await ask('Password 2FA (tekan Enter jika tidak ada): '),
  phoneCode: async () => await ask('Kode OTP dari Telegram: '),
  onError: (err) => console.error('[ERROR]', err.message),
});

const sessionString = client.session.save();

console.log('\n=== SESSION STRING (simpan ini!) ===');
console.log(sessionString);
console.log('====================================\n');
console.log('Langkah selanjutnya:');
console.log('  1. Copy string panjang di atas');
console.log('  2. Paste ke SESSION_B di ecosystem.config.cjs');
console.log('  3. Jalankan: pm2 restart worker-2');
console.log('');

rl.close();
await client.disconnect();
