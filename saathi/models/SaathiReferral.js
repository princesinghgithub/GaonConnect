const mongoose = require('mongoose');

// Ek referred banda = ek row. Driver ho ya customer, dono yahin aate hain.
// Portal ke "Drivers Added" aur "Customers Added" screens seedha isi se bante hain.

const SaathiReferralSchema = new mongoose.Schema({
  saathi: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Saathi',
    required: true,
  },

  type: {
    type:     String,
    enum:     ['driver', 'customer'],
    required: true,
  },

  // Referred banda — dono case mein User row hoti hai
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // Sirf driver referral ke liye — KYC status isi se padha jaata hai
  provider: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'Provider',
    default: null,
  },

  // Jo code us waqt type/scan hua tha (audit ke liye — Saathi ka code baad
  // mein badal jaaye to bhi record sach rahe)
  code: { type: String, uppercase: true, trim: true, required: true },

  // joined       — signup ho gaya
  // verified     — sirf driver: admin ne KYC approve kiya
  // activated    — pehli ride complete ho gayi (yahi par reward banta hai)
  // rejected     — driver KYC reject ho gayi
  status: {
    type:    String,
    enum:    ['joined', 'verified', 'activated', 'rejected'],
    default: 'joined',
  },

  village: { type: String, trim: true, default: '' },

  firstRide:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null },
  firstRideAt: { type: Date, default: null },

  // Reward ban chuka hai ya nahi — cron dobara chale to double payment na ho.
  // Asli guard SaathiEarning ka unique index hai; ye sirf tez lookup ke liye.
  rewarded: { type: Boolean, default: false },
}, { timestamps: true });

// Ek banda sirf ek baar refer ho sakta hai. Do Saathi same driver ko claim
// karein to pehla hi jeetega — race condition DB level par ruk jaayegi.
SaathiReferralSchema.index({ type: 1, user: 1 }, { unique: true });
SaathiReferralSchema.index({ saathi: 1, type: 1, createdAt: -1 });
SaathiReferralSchema.index({ status: 1, rewarded: 1 });

module.exports = mongoose.model('SaathiReferral', SaathiReferralSchema);
