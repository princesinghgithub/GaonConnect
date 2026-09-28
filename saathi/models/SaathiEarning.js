const mongoose = require('mongoose');

// Saathi ka paisa yahan ledger ki tarah rakha jaata hai — har reward ek row.
// Balance kahin store nahi hota, hamesha isi ledger se jodkar nikalta hai.
// Isse "wallet aur history match nahi kar rahe" wali classic bug hoti hi nahi.

const SaathiEarningSchema = new mongoose.Schema({
  saathi: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Saathi',
    required: true,
  },

  type: {
    type: String,
    enum: [
      'driver_activation',      // referred driver ki pehli ride complete
      'customer_first_booking', // referred customer ki pehli ride complete
      'milestone_bonus',        // X activations pura hone par
      'adjustment',             // admin ka manual credit/debit
    ],
    required: true,
  },

  // Debit (adjustment) ke liye negative ho sakta hai
  amount: { type: Number, required: true },

  // pending  — ban gaya, admin review baaki
  // approved — Saathi ka paisa ban gaya, withdraw ho sakta hai
  // rejected — cancel (duplicate/fraud)
  //
  // 'paid' yahan jaan-bujhkar nahi hai. Ye ledger sirf CREDIT rakhta hai;
  // paisa nikalna DEBIT hai jo SaathiWithdrawal mein darj hota hai.
  // Balance = approved earnings − withdrawals. Isse na koi row lock karni
  // padti hai, na todni — aur hisaab kabhi ulta nahi padta.
  status: {
    type:    String,
    enum:    ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  referral: { type: mongoose.Schema.Types.ObjectId, ref: 'SaathiReferral', default: null },
  ride:     { type: mongoose.Schema.Types.ObjectId, ref: 'Ride',           default: null },

  // Portal ki earnings table seedha ye do fields dikhati hai
  reason:    { type: String, default: '' }, // "Driver first completed booking"
  reference: { type: String, default: '' }, // "Ramesh Patel"

  approvedAt: Date,
  rejectedAt: Date,
  remarks:    { type: String, default: '' },
}, { timestamps: true });

// Ek referral par ek hi baar wahi reward — cron do baar chale, ya do request
// ek saath aayein, DB dusri ko reject kar dega.
SaathiEarningSchema.index(
  { saathi: 1, type: 1, referral: 1 },
  { unique: true, partialFilterExpression: { referral: { $type: 'objectId' } } }
);

SaathiEarningSchema.index({ saathi: 1, createdAt: -1 });
SaathiEarningSchema.index({ saathi: 1, status: 1 });

module.exports = mongoose.model('SaathiEarning', SaathiEarningSchema);
