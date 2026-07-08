const crypto = require('crypto');
const https  = require('https');
const redis  = require('../config/redis');

const OTP_EXPIRY_MINUTES  = parseInt(process.env.MSG91_OTP_EXPIRY  || '10');
const OTP_LENGTH          = parseInt(process.env.MSG91_OTP_LENGTH   || '6');
const OTP_TTL_SECONDS     = OTP_EXPIRY_MINUTES * 60;
const COOLDOWN_SECONDS    = 60;
const MAX_VERIFY_ATTEMPTS = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizePhone = (phone) => {
  const cleaned = String(phone || '').replace(/[^\d]/g, '');
  const ten = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
  if (!/^[6-9][0-9]{9}$/.test(ten)) return null;
  return `+91${ten}`;
};

const generateOTP = () => {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

const otpKey      = (phone) => `otp:${phone}`;
const sentAtKey   = (phone) => `otp_sent_at:${phone}`;
const attemptsKey = (phone) => `otp_attempts:${phone}`;

// ─── MSG91 Send OTP ───────────────────────────────────────────────────────────
// Custom OTP pass karte hain taaki Redis verification same rahe
const sendViaMsg91 = (normalizedPhone, otp) => {
  return new Promise((resolve) => {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      console.error('MSG91_AUTH_KEY .env mein nahi hai');
      return resolve(false);
    }

    // MSG91 format: 91XXXXXXXXXX (no '+')
    const mobile = normalizedPhone.replace('+', '');

    const payload = {
      mobile,
      otp,
      otp_length: OTP_LENGTH,
      otp_expiry: OTP_EXPIRY_MINUTES,
    };
    if (process.env.MSG91_TEMPLATE_ID) {
      payload.template_id = process.env.MSG91_TEMPLATE_ID;
    }

    const body = JSON.stringify(payload);

    const options = {
      hostname: 'control.msg91.com',
      path:     '/api/v5/otp',
      method:   'POST',
      headers: {
        'authkey':        authKey,
        'content-type':   'application/json',
        'accept':         'application/json',
        'content-length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'success') {
            console.log(`MSG91 OTP sent to ${mobile}`);
            resolve(true);
          } else {
            console.error(`MSG91 send error (status ${res.statusCode}):`, data);
            resolve(false);
          }
        } catch (err) {
          console.error(`MSG91 response parse error (status ${res.statusCode}):`, data, err.message);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('MSG91 request error:', err.message);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
};

// ─── Fast2SMS Send OTP (Quick SMS route) ──────────────────────────────────────
const sendViaFast2Sms = (normalizedPhone, otp) => {
  return new Promise((resolve) => {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.error('FAST2SMS_API_KEY .env mein nahi hai');
      return resolve(false);
    }

    // Fast2SMS format: 10 digit number, no '+91'
    const mobile = normalizedPhone.replace('+91', '');

    const message = encodeURIComponent(`Your GaonConnect OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share with anyone.`);
    const path = `/dev/bulkV2?authorization=${apiKey}&message=${message}&route=q&numbers=${mobile}`;

    const options = {
      hostname: 'www.fast2sms.com',
      path,
      method:   'GET',
      headers:  { 'cache-control': 'no-cache' },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return === true) {
            console.log(`Fast2SMS OTP sent to ${mobile}`);
            resolve(true);
          } else {
            console.error(`Fast2SMS send error (status ${res.statusCode}):`, data);
            resolve(false);
          }
        } catch (err) {
          console.error(`Fast2SMS response parse error (status ${res.statusCode}):`, data, err.message);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Fast2SMS request error:', err.message);
      resolve(false);
    });

    req.end();
  });
};

// ─── Public: Send OTP ─────────────────────────────────────────────────────────
const sendOTP = async (phone) => {
  try {
    const normalized = normalizePhone(phone);
    if (!normalized) return { success: false, message: 'Invalid phone. 10-digit Indian number daalo.' };

    // Cooldown — 60 sec ke andar dobara nahi
    const sentAt = await redis.get(sentAtKey(normalized));
    if (sentAt) {
      const elapsed   = Math.floor((Date.now() - parseInt(sentAt)) / 1000);
      const remaining = COOLDOWN_SECONDS - elapsed;
      if (remaining > 0) {
        return { success: false, message: `OTP pehle se bheja gaya. ${remaining} seconds baad try karo.` };
      }
    }

    const otp = generateOTP();

    // Atomic Redis store
    const pipeline = redis.pipeline();
    pipeline.setex(otpKey(normalized),    OTP_TTL_SECONDS, otp);
    pipeline.setex(sentAtKey(normalized), OTP_TTL_SECONDS, Date.now().toString());
    pipeline.del(attemptsKey(normalized));
    await pipeline.exec();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📱 [DEV] OTP for ${normalized}: ${otp}\n`);
    } else {
      await sendViaFast2Sms(normalized, otp);
    }

    return {
      success: true,
      message: 'OTP bheja gaya!',
      phone: normalized,
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    };
  } catch (error) {
    console.error('sendOTP Error:', error);
    return { success: false, message: 'OTP bhejne mein error. Dobara try karo.' };
  }
};

// ─── Public: Verify OTP ───────────────────────────────────────────────────────
const verifyOTP = async (phone, otp) => {
  try {
    const normalized = normalizePhone(phone);
    if (!normalized) return { success: false, message: 'Invalid phone number.' };

    const attempts = parseInt((await redis.get(attemptsKey(normalized))) || '0');
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await redis.del(otpKey(normalized));
      return { success: false, message: 'Bahut zyada galat attempts. OTP cancel. Dobara bhejo.' };
    }

    const stored = await redis.get(otpKey(normalized));
    if (!stored) return { success: false, message: 'OTP nahi mila ya expire ho gaya. Dobara bhejo.' };

    if (stored !== String(otp)) {
      const pipeline = redis.pipeline();
      pipeline.incr(attemptsKey(normalized));
      pipeline.expire(attemptsKey(normalized), OTP_TTL_SECONDS);
      await pipeline.exec();
      const remaining = MAX_VERIFY_ATTEMPTS - (attempts + 1);
      return {
        success: false,
        message: remaining > 0
          ? `OTP galat hai. ${remaining} aur attempts baaki hain.`
          : 'OTP galat hai. Dobara bhejo.',
      };
    }

    // OTP correct — sab keys clear karo
    const pipeline = redis.pipeline();
    pipeline.del(otpKey(normalized));
    pipeline.del(sentAtKey(normalized));
    pipeline.del(attemptsKey(normalized));
    await pipeline.exec();

    return { success: true, message: 'OTP verified!' };
  } catch (error) {
    console.error('verifyOTP Error:', error);
    return { success: false, message: 'OTP verify karne mein error.' };
  }
};

module.exports = { sendOTP, verifyOTP, normalizePhone };
