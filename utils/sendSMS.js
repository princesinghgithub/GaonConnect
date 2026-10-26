const https = require('https');
const { normalizePhone } = require('./sendOTP');

// Transactional SMS — MSG91 Flow API (/api/v5/flow).
// Note: sendOTP.js wala /api/v5/otp endpoint sirf OTP bhej sakta hai, isliye
// baaki sab messages ke liye yeh alag endpoint chahiye.
//
// DLT: Entity ID aur Header (sender ID) wahi hain jo OTP ke liye register kiye the.
// Har naye message text ke liye DLT pe alag content template approve karana padta hai,
// aur uska MSG91 template_id .env mein daalna hota hai.

const MSG91_HOST = 'control.msg91.com';
const MSG91_PATH = '/api/v5/flow';

/**
 * Ek recipient ko template-based SMS bhejo
 * @param {object} opts
 * @param {string} opts.phone      - 10-digit ya +91 wala number
 * @param {string} opts.templateId - MSG91 template ID (DLT approved)
 * @param {object} opts.vars       - Template variables, e.g. { name: 'Ramesh' }
 * @returns {Promise<boolean>}     - true if sent, false if skipped/failed
 */
const sendSMS = ({ phone, templateId, vars = {} }) => {
  return new Promise((resolve) => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      console.error(`SMS skip: invalid phone (${phone})`);
      return resolve(false);
    }

    // MSG91 format: 91XXXXXXXXXX (no '+')
    const mobiles = normalized.replace('+', '');

    // Dev mein SMS credits waste mat karo — sirf log
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📩 [DEV] SMS → ${mobiles} | template ${templateId || '(not set)'} |`, vars, '\n');
      return resolve(true);
    }

    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      console.error('SMS skip: MSG91_AUTH_KEY .env mein nahi hai');
      return resolve(false);
    }
    if (!templateId) {
      console.error('SMS skip: template_id missing (.env mein DLT template ID daalo)');
      return resolve(false);
    }

    const body = JSON.stringify({
      template_id: templateId,
      short_url: '0',
      recipients: [{ mobiles, ...vars }],
    });

    const options = {
      hostname: MSG91_HOST,
      path:     MSG91_PATH,
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
            console.log(`MSG91 SMS sent to ${mobiles} (template ${templateId})`);
            resolve(true);
          } else {
            console.error(`MSG91 SMS error (status ${res.statusCode}):`, data);
            resolve(false);
          }
        } catch (err) {
          console.error(`MSG91 SMS parse error (status ${res.statusCode}):`, data, err.message);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('MSG91 SMS request error:', err.message);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy(new Error('MSG91 SMS request timed out'));
    });

    req.write(body);
    req.end();
  });
};

// ─── Message Templates ────────────────────────────────────────────────────────
// Variable naam (name, reason) DLT template ke ##var## naam se exactly match hone
// chahiye, warna MSG91 blank bhej dega.

const smsNotify = {

  // Driver ne registration complete ki — abhi approval pending hai
  driverRegistered: (phone, { name }) =>
    sendSMS({
      phone,
      templateId: process.env.MSG91_TPL_DRIVER_REGISTERED,
      vars: { name: name || 'Driver' },
    }),

  // Admin ne driver ko approve kar diya
  driverApproved: (phone, { name }) =>
    sendSMS({
      phone,
      templateId: process.env.MSG91_TPL_DRIVER_APPROVED,
      vars: { name: name || 'Driver' },
    }),

  // Admin ne driver reject kiya
  driverRejected: (phone, { name, reason }) =>
    sendSMS({
      phone,
      templateId: process.env.MSG91_TPL_DRIVER_REJECTED,
      vars: { name: name || 'Driver', reason: reason || 'documents verify nahi hue' },
    }),
};

module.exports = { sendSMS, smsNotify };
