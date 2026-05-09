import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import * as readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const apiId = 35854665;
const apiHash = '9454711c7e5a7fec99b312280792b467';

const client = new TelegramClient(
  new StringSession(''),
  apiId,
  apiHash,
  { connectionRetries: 5 }
);

await client.start({
  phoneNumber: async () => await ask('Nomor HP (format +62xxx): '),
  password: async () => await ask('Password 2FA (enter jika tidak ada): '),
  phoneCode: async () => await ask('Kode OTP dari Telegram: '),
  onError: (err) => console.log('Error:', err),
});

console.log('\n=== SESSION STRING (simpan ini!) ===');
console.log(client.session.save());
console.log('====================================\n');

rl.close();
await client.disconnect();
