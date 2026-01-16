const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getWalletBalance,
  getTransactionHistory,
  requestWithdrawal,
  getEarningsReport
} = require('../controllers/walletcontroller');

// Get wallet balance
router.get('/balance', protect, getWalletBalance);

// Get transaction history
router.get('/transactions', protect, getTransactionHistory);

// Request withdrawal
router.post('/withdraw', protect, requestWithdrawal);

// Get earnings report
router.get('/earnings/report', protect, getEarningsReport);

module.exports = router;