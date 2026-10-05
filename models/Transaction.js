const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // Pehle har transaction driver ki hoti thi, isliye provider required tha.
  // Ab customer ki bhi hoti hain (wallet top-up, cancellation fee, tip),
  // isliye dono optional hain aur pre-validate ek ka hona zaroori karta hai.
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Paisa kis wajah se hila — reporting aur user ko dikhane ke liye.
  category: {
    type: String,
    enum: [
      'ride_earning',
      'withdrawal',
      'topup',
      'ride_payment',
      'cancellation_fee',
      'tip',
      'referral_bonus',
      'incentive',
      'adjustment'
    ],
    default: 'adjustment'
  },

  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  },

  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },

  balanceAfter: {
    type: Number
  },

  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },

  transactionId: {
    type: String // For payment gateway transaction ID
  },

  processedAt: Date,

  // Customer ka cancel charge jab wasool hoga tab kis driver ko dena hai.
  // Charge 'pending' ho to driver ko paisa turant nahi milta — customer ke
  // bharte hi (agli ride par) isi driver ke wallet mein jaata hai.
  payoutProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },

  failureReason: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Provider ya user — kam se kam ek hona chahiye, warna transaction kiski hai
// yeh pata hi nahi chalega aur wo report se gayab ho jaayegi.
TransactionSchema.pre('validate', function (next) {
  if (!this.provider && !this.user) {
    return next(new Error('Transaction ka provider ya user, ek hona zaroori hai'));
  }
  next();
});

// Index for faster queries
TransactionSchema.index({ provider: 1, createdAt: -1 });
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);