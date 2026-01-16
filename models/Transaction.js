const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
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

  failureReason: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
TransactionSchema.index({ provider: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);