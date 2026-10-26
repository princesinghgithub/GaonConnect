const mongoose = require('mongoose');

// Admin dashboard ka login data — password + Google Authenticator (2FA).
// User model se alag collection isliye rakha hai taaki customer/driver app ke
// flow (phone OTP) ko chhede bina admin login badla ja sake, aur yeh secrets
// kabhi galti se kisi user API response mein na chale jaayein.
const AdminAuthSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
  },

  passwordHash: { type: String, select: false },
  passwordChangedAt: { type: Date },

  // ─── Google Authenticator (TOTP) ────────────────────────────────────────────
  // pendingTotpSecret: pehli baar QR dikhaya par abhi code se confirm nahi hua.
  // Confirm hone pe hi totpSecret mein jaata hai — adha-adhura setup login na tode.
  totpSecret:        { type: String, select: false },
  pendingTotpSecret: { type: String, select: false },
  totpEnabled:       { type: Boolean, default: false },
  // Aakhri use hua time-step — same 6-digit code dobara use nahi ho sakta
  lastTotpStep:      { type: Number, default: 0, select: false },

  // Ek-baar wale backup codes, sirf SHA-256 hash save hota hai
  backupCodes: { type: [String], default: [], select: false },

  // ─── Brute-force lock ───────────────────────────────────────────────────────
  failedLogins: { type: Number, default: 0 },
  lockUntil:    { type: Date },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AdminAuth', AdminAuthSchema);
