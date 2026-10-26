// Admin login ka emergency/setup tool — server (ya MONGO_URI wale laptop) se chalao.
// Isko email ya SMS ki zaroorat nahi, isliye koi bhi vendor band ho, yeh chalega.
//
// Usage:
//   node scripts/adminAuth.js set-password <admin-email>   Pehli baar password set karo / bhoola password reset karo
//   node scripts/adminAuth.js reset-2fa    <admin-email>   Phone kho gaya — Authenticator hatao, agle login pe naya QR aayega
//   node scripts/adminAuth.js status       <admin-email>   Dekho kya set hai
//   node scripts/adminAuth.js create       <email> <phone> Naya admin (jaise khaali test database mein)
//
// set-password aur reset-2fa sabhi devices se logout bhi karte hain.

const readline  = require('readline');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const dotenv    = require('dotenv');

// Server jaisa: .env.local (apna computer) pehle — wahan test database
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') });
dotenv.config();

const User      = require('../models/User');
const AdminAuth = require('../models/AdminAuth');

const MIN_PASSWORD_LENGTH = 10;

// Terminal mein password type karte waqt dikhna nahi chahiye. Ek hi readline
// poori script ke liye — har prompt pe naya banao to pehla wala aage ki lines
// bhi kha jaata hai (paste ya piped input mein dusra prompt atak jaata tha).
let rl;
const pendingLines = [];
const waiting = [];

const askHidden = (question) => {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
    rl._writeToOutput = () => {}; // typed characters echo mat karo
    rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : pendingLines.push(line)));
  }
  process.stdout.write(question);
  return new Promise((resolve) => {
    const done = (line) => { process.stdout.write('\n'); resolve(line); };
    if (pendingLines.length) done(pendingLines.shift());
    else waiting.push(done);
  });
};

// Redis alag service hai — na mile to bhi DB ka kaam ho chuka hai, bas warning do
const logoutEverywhere = async (userId) => {
  try {
    const redis = require('../config/redis');
    const { revokeAllUserTokens } = require('../utils/tokenService');
    await Promise.race([
      revokeAllUserTokens(userId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 10000)),
    ]);
    await redis.quit().catch(() => {});
    console.log('Sabhi devices se logout kar diya.');
  } catch (err) {
    console.warn(`⚠️  Devices se logout nahi ho paya (${err.message}). Purane sessions max 60 din tak chal sakte hain.`);
  }
};

const setPassword = async (user) => {
  const password = await askHidden('Naya password: ');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password kam se kam ${MIN_PASSWORD_LENGTH} characters ka hona chahiye`);
  }
  const confirm = await askHidden('Dobara daalo: ');
  if (password !== confirm) throw new Error('Dono password match nahi hue');

  await AdminAuth.findOneAndUpdate(
    { user: user._id },
    {
      $set:   { passwordHash: await bcrypt.hash(password, 12), passwordChangedAt: new Date(), failedLogins: 0 },
      $unset: { lockUntil: 1 },
    },
    { upsert: true }
  );
  console.log(`✅ Password set ho gaya: ${user.email}`);
  await logoutEverywhere(user._id);
};

const reset2fa = async (user) => {
  const result = await AdminAuth.updateOne(
    { user: user._id },
    {
      $set:   { totpEnabled: false, lastTotpStep: 0, backupCodes: [] },
      $unset: { totpSecret: 1, pendingTotpSecret: 1 },
    }
  );
  if (result.matchedCount === 0) throw new Error('Is admin ka password abhi set nahi hua. Pehle set-password chalao.');
  console.log(`✅ Google Authenticator hata diya: ${user.email}`);
  console.log('   Agle login pe naya QR code aayega — use naye phone se scan karo.');
  await logoutEverywhere(user._id);
};

const showStatus = async (user) => {
  const auth = await AdminAuth.findOne({ user: user._id }).select('+passwordHash +backupCodes');
  console.log(`Admin:           ${user.name} <${user.email}>`);
  console.log(`Password set:    ${auth?.passwordHash ? 'haan' : 'nahi'}`);
  console.log(`Authenticator:   ${auth?.totpEnabled ? 'on' : 'off (agle login pe setup hoga)'}`);
  console.log(`Backup codes:    ${auth?.backupCodes?.length || 0} baaki`);
  if (auth?.lockUntil && auth.lockUntil > new Date()) console.log(`Locked till:     ${auth.lockUntil.toLocaleString()}`);
};

const COMMANDS = { 'set-password': setPassword, 'reset-2fa': reset2fa, status: showStatus, create: setPassword };

const main = async () => {
  const [command, rawEmail] = process.argv.slice(2);
  const run = COMMANDS[command];
  if (!run || !rawEmail) {
    console.log('Usage: node scripts/adminAuth.js <set-password|reset-2fa|status> <admin-email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  // Kis database par chal raha hai — galti se live par na chale
  console.log(`📦 Database: ${mongoose.connection.name}`);

  const email = rawEmail.trim().toLowerCase();

  // Naya admin (jaise khaali test database mein) — phir password poochhta hai
  if (command === 'create') {
    const phone = String(process.argv[4] || '').replace(/[^0-9]/g, '').slice(-10);
    if (phone.length !== 10) throw new Error('Usage: node scripts/adminAuth.js create <email> <10-digit-phone>');
    if (await User.findOne({ email })) throw new Error(`${email} pehle se hai — set-password chalao`);
    const created = await User.create({ name: 'Admin', email, phone, role: 'admin' });
    console.log(`✅ Admin bana: ${email}`);
    await setPassword(created);
    await mongoose.disconnect();
    process.exit(0);
  }

  const user  = await User.findOne({ email, role: 'admin' });
  if (!user) throw new Error(`${email} naam ka koi admin nahi mila`);

  await run(user);
  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (err) => {
  console.error(`❌ ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
