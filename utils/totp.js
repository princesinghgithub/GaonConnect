const crypto = require('crypto');

// TOTP (RFC 6238) — Google Authenticator / Microsoft Authenticator / Authy
// sab isi standard pe chalte hain. Code phone ki app khud banati hai, isliye
// na SMS lagta hai na email — kisi vendor ka bill ya outage login nahi rokta.
// Library ki jagah khud likha hai kyunki poora algorithm ~50 lines ka hai.

const PERIOD   = 30; // seconds — har 30 sec mein naya code
const DIGITS   = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // base32 (RFC 4648)

const base32Encode = (buf) => {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
};

const base32Decode = (str) => {
  const clean = String(str).toUpperCase().replace(/[\s=]/g, '');
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 secret');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
      value &= (1 << bits) - 1;
    }
  }
  return Buffer.from(out);
};

// 160-bit secret — RFC 4226 ka recommended size
const generateSecret = () => base32Encode(crypto.randomBytes(20));

const hotp = (key, counter) => {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac   = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
};

// Sahi code ho toh uska time-step number lautata hai, warna null.
// Step caller ko isliye chahiye taaki ek hi code do baar use na ho sake (replay).
// window = 1 → phone ki ghadi 30 sec aage/peeche ho tab bhi chalega.
const verify = (secret, code, window = 1) => {
  const input = String(code || '').trim();
  if (!/^\d{6}$/.test(input)) return null;

  const key  = base32Decode(secret);
  const now  = Math.floor(Date.now() / 1000 / PERIOD);
  const want = Buffer.from(input);

  for (let i = -window; i <= window; i++) {
    const got = Buffer.from(hotp(key, now + i));
    if (crypto.timingSafeEqual(got, want)) return now + i;
  }
  return null;
};

// Authenticator app yahi URL QR code se padhti hai
const buildOtpAuthUrl = ({ secret, account, issuer }) => {
  const label  = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits:    String(DIGITS),
    period:    String(PERIOD),
  });
  // URLSearchParams space ko '+' banata hai; kuch authenticator apps ise
  // "GaonConnect+Admin" dikhati hain, isliye %20
  return `otpauth://totp/${label}?${params.toString().replace(/\+/g, '%20')}`;
};

module.exports = { generateSecret, verify, buildOtpAuthUrl, hotp, base32Decode };
