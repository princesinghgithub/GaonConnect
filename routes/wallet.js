const express = require('express');
const router  = express.Router();

const { protect }                        = require('../middleware/auth');
const { strictLimiter }                  = require('../middleware/rateLimiter');
const { validate, schemas }              = require('../middleware/validate');
const {
  getWalletBalance,
  getTransactionHistory,
  requestWithdrawal,
  getEarningsReport,
  createTopupOrder,
  verifyTopup,
  tipDriver,
} = require('../controllers/walletcontroller');

// Wallet balance
router.get('/balance',      protect, getWalletBalance);

// Transaction history
router.get('/transactions', protect, getTransactionHistory);

// Withdrawal — strict limiter (5 requests/hour) + input validation
router.post('/withdraw',    protect, strictLimiter, validate(schemas.requestWithdrawal), requestWithdrawal);

// Earnings report
router.get('/earnings/report', protect, getEarningsReport);

// Wallet top-up — order banao, phir Razorpay signature verify karke credit karo.
// Order banane pe strict limiter isliye taaki koi loop mein orders na banata rahe.
router.post('/topup/order',  protect, strictLimiter, createTopupOrder);
router.post('/topup/verify', protect, verifyTopup);

// Driver ko tip — wallet se jaata hai, isliye top-up ke baad hi kaam karega.
router.post('/tip', protect, tipDriver);

module.exports = router;
