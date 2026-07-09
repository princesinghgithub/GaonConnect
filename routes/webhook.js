const express = require('express');
const router  = express.Router();

const { razorpayWebhook } = require('../controllers/webhookController');

// Raw body zaroori hai — Razorpay signature isi exact byte stream se compute hoti hai.
router.post('/razorpay', express.raw({ type: 'application/json' }), razorpayWebhook);

module.exports = router;
