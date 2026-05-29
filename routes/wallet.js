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
} = require('../controllers/walletcontroller');

// Wallet balance
router.get('/balance',      protect, getWalletBalance);

// Transaction history
router.get('/transactions', protect, getTransactionHistory);

// Withdrawal — strict limiter (5 requests/hour) + input validation
router.post('/withdraw',    protect, strictLimiter, validate(schemas.requestWithdrawal), requestWithdrawal);

// Earnings report
router.get('/earnings/report', protect, getEarningsReport);

module.exports = router;
