const crypto = require('crypto');
const https  = require('https');
const redis  = require('../config/redis');

const OTP_TTL_SECONDS    = 600;  // 10 minutes
const COOLDOWN_SECONDS   = 60;   // 1 min between resends
const MAX_VERIFY_ATTEMPTS = 5;

// ─── Fast2SMS OTP Send ────────────────────────────────────────────────────────
const sendSmsViaFast2SMS = (phone, otp) => {
  return new Promise((resolve) => {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.error('FAST2SMS_API_KEY .env mein nahi hai');
      return resolve();
    }

    // phone = +91XXXXXXXXXX → sirf 10 digits chahiye Fast2SMS ko
    const mobile = phone.replace('+91', '');

    const message = encodeURIComponent(`Your GaonConnect OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`);
    const path = `/dev/bulkV2?authorization=${apiKey}&message=${message}&route=q&numbers=${mobile}`;

    const options = {
      hostname: 'www.fast2sms.com',
      path,
      method:  'GET',
      headers: { 'cache-control': 'no-cache' },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end',  () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return) {
            console.log(`SMS sent to ${mobile}`);
            resolve(parsed);
          } else {
            console.error('Fast2SMS error:', data);
            resolve();
          }
        } catch { resolve(); }
      });
    });

    req.on('error', (err) => {
      console.error('Fast2SMS request failed:', err.message);
      resolve();
    });

    req.end();
  });
};

const normalizePhone = (phone) => {
  const cleaned = String(phone || '').replace(/[^\d]/g, '');
  const ten = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
  if (!/^[6-9][0-9]{9}$/.test(ten)) return null;
  return `+91${ten}`;
};

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Keys
const otpKey      = (phone) => `otp:${phone}`;
const sentAtKey   = (phone) => `otp_sent_at:${phone}`;
const attemptsKey = (phone) => `otp_attempts:${phone}`;

const sendOTP = async (phone) => {
  try {
    const normalized = normalizePhone(phone);
    if (!normalized) return { success: false, message: 'Invalid phone number. 10 digit valid Indian number daalo.' };

    // Cooldown check — 60 sec ke andar dobara nahi
    const sentAt = await redis.get(sentAtKey(normalized));
    if (sentAt) {
      const elapsed = Math.floor((Date.now() - parseInt(sentAt)) / 1000);
      const remaining = COOLDOWN_SECONDS - elapsed;
      if (remaining > 0) {
        return { success: false, message: `OTP pehle se bheja gaya. ${remaining} seconds baad dobara try karo.` };
      }
    }

    const otp = generateOTP();

    // Store OTP aur sent timestamp — atomic pipeline
    const pipeline = redis.pipeline();
    pipeline.setex(otpKey(normalized),    OTP_TTL_SECONDS, otp);
    pipeline.setex(sentAtKey(normalized), OTP_TTL_SECONDS, Date.now().toString());
    pipeline.del(attemptsKey(normalized)); // reset previous attempts
    await pipeline.exec();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📱 [DEV] OTP for ${normalized}: ${otp}\n`);
    } else {
      // Production: Fast2SMS se real SMS bhejo
      await sendSmsViaFast2SMS(normalized, otp);
    }

    return {
      success: true,
      message: 'OTP sent!',
      phone: normalized,
      ...(process.env.NODE_ENV !== 'production' && { otp }), // dev mein hi return karo
    };
  } catch (error) {
    console.error('sendOTP Error:', error);
    return { success: false, message: 'OTP bhejne mein error. Dobara try karo.' };
  }
};

const verifyOTP = async (phone, otp) => {
  try {
    const normalized = normalizePhone(phone);
    if (!normalized) return { success: false, message: 'Invalid phone number.' };

    // Attempt count check — brute force protection
    const attempts = parseInt((await redis.get(attemptsKey(normalized))) || '0');
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await redis.del(otpKey(normalized));
      return { success: false, message: 'Bahut zyada galat attempts. OTP cancel kar diya. Dobara bhejo.' };
    }

    const stored = await redis.get(otpKey(normalized));
    if (!stored) return { success: false, message: 'OTP nahi mila ya expire ho gaya. Dobara bhejo.' };

    if (stored !== String(otp)) {
      // Increment attempt counter with TTL
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

    // OTP correct — sab keys delete karo
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
