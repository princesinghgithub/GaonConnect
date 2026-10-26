const mongoose = require('mongoose');

// Saathi ka payout request. Driver wale `Withdrawal` model se alag hai —
// wahan `driver` ref hai aur uska approval flow admin ke driver section mein
// hai. Dono ko ek model mein ghusane se dono side confuse hoti.

const SaathiWithdrawalSchema = new mongoose.Schema({
  saathi: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Saathi',
    required: true,
  },

  amount: { type: Number, required: true, min: 1 },

  method: { type: String, enum: ['upi', 'bank'], required: true },

  // Request ke waqt ka snapshot — baad mein Saathi apna UPI badal de to bhi
  // ye record bata sake ki paisa kahan bheja gaya tha.
  upiId: { type: String, trim: true, default: '' },
  bank: {
    accountNumber:     { type: String, default: '' },
    ifscCode:          { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    bankName:          { type: String, default: '' },
  },

  status: {
    type:    String,
    enum:    ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },

  remarks:     { type: String, default: '' },
  utr:         { type: String, default: '' }, // bank/UPI reference number
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date,
}, { timestamps: true });

SaathiWithdrawalSchema.index({ saathi: 1, createdAt: -1 });
SaathiWithdrawalSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SaathiWithdrawal', SaathiWithdrawalSchema);
