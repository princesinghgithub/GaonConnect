const mongoose = require('mongoose');

// Saathi = gaon ka village partner jo drivers aur customers ko GaonConnect se
// jodta hai aur completed bookings par incentive kamata hai.
//
// Ye jaan-bujhkar `User` model se alag rakha gaya hai. Saathi na ride book
// karta hai na ride leta hai — uska login, dashboard aur paisa sab alag hai.
// Isse User model ka role enum chhedna nahi padta aur driver/customer app ka
// auth bilkul waisa hi rehta hai jaisa tha.

const SaathiSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Naam required hai'],
    trim:     true,
  },

  phone: {
    type:     String,
    required: [true, 'Phone number required hai'],
    unique:   true,
    match:    [/^[6-9][0-9]{9}$/, 'Valid 10-digit mobile number daalo'],
  },

  email: {
    type:      String,
    trim:      true,
    lowercase: true,
    unique:    true,
    sparse:    true,
  },

  // ─── Kahan kaam karta hai ───────────────────────────────────────────────────
  village:  { type: String, trim: true, default: '' },
  district: { type: String, trim: true, default: '' },
  state:    { type: String, trim: true, default: '' },

  // ─── Pehchaan ───────────────────────────────────────────────────────────────
  // saathiCode = referral code jo driver/customer type karta hai (MAU001)
  // saathiId   = display ID jo portal aur support par dikhta hai (GC-MAU-001)
  saathiCode: {
    type:      String,
    required:  true,
    unique:    true,
    uppercase: true,
    trim:      true,
  },

  saathiId: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
  },

  // pending  — register kiya, admin ne abhi verify nahi kiya
  // active   — verify ho gaya, referral chal sakta hai
  // suspended— admin ne rok diya
  status: {
    type:    String,
    enum:    ['pending', 'active', 'suspended'],
    default: 'pending',
  },

  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String, default: '' },

  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ─── Paisa kahan bhejna hai ─────────────────────────────────────────────────
  payout: {
    method: { type: String, enum: ['upi', 'bank'], default: 'upi' },
    upiId:  { type: String, trim: true, default: '' },
    bank: {
      accountNumber:     { type: String, trim: true, default: '' },
      ifscCode:          { type: String, trim: true, uppercase: true, default: '' },
      accountHolderName: { type: String, trim: true, default: '' },
      bankName:          { type: String, trim: true, default: '' },
    },
  },

  // Portal ka hindi/english toggle yaad rakhne ke liye
  language: { type: String, enum: ['hi', 'en'], default: 'hi' },

  lastLoginAt: Date,
}, { timestamps: true });

SaathiSchema.index({ status: 1 });
SaathiSchema.index({ district: 1, village: 1 });

module.exports = mongoose.model('Saathi', SaathiSchema);
