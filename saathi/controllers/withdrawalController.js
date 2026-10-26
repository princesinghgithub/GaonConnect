const SaathiWithdrawal  = require('../models/SaathiWithdrawal');
const { getBalance }    = require('../services/rewards');
const incentives        = require('../config/incentives');

const UPI_REGEX  = /^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// ─── GET /api/saathi/withdrawals ─────────────────────────────────────────────
const getWithdrawals = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [balance, total, rows, hasPending] = await Promise.all([
    getBalance(req.saathi._id),
    SaathiWithdrawal.countDocuments({ saathi: req.saathi._id }),
    SaathiWithdrawal.find({ saathi: req.saathi._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('amount method status remarks utr createdAt processedAt'),
    SaathiWithdrawal.exists({ saathi: req.saathi._id, status: { $in: ['pending', 'approved'] } }),
  ]);

  return res.json({
    success: true,
    data: {
      available:     balance.available,
      pending:       balance.pending,
      paid:          balance.paid,
      minWithdrawal: incentives.MIN_WITHDRAWAL,
      maxWithdrawal: incentives.MAX_WITHDRAWAL,
      canRequest:    !hasPending && balance.available >= incentives.MIN_WITHDRAWAL,
      history:       rows,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── POST /api/saathi/withdrawals ────────────────────────────────────────────
const requestWithdrawal = async (req, res) => {
  const { amount, method = 'upi', upiId, bank } = req.body;

  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount daalo.' });
  }
  if (value < incentives.MIN_WITHDRAWAL) {
    return res.status(400).json({ success: false, message: `Minimum withdrawal ₹${incentives.MIN_WITHDRAWAL} hai.` });
  }
  if (value > incentives.MAX_WITHDRAWAL) {
    return res.status(400).json({ success: false, message: `Ek baar mein zyada se zyada ₹${incentives.MAX_WITHDRAWAL} nikal sakte hain.` });
  }
  if (!['upi', 'bank'].includes(method)) {
    return res.status(400).json({ success: false, message: "Method 'upi' ya 'bank' hona chahiye." });
  }

  // Ek waqt par ek hi request — warna same balance do baar claim ho jaata
  const alreadyOpen = await SaathiWithdrawal.exists({
    saathi: req.saathi._id,
    status: { $in: ['pending', 'approved'] },
  });
  if (alreadyOpen) {
    return res.status(400).json({ success: false, message: 'Aapki ek withdrawal request pehle se process ho rahi hai.' });
  }

  // Payout detail request ke saath aa sakti hai, warna profile se uthate hain
  const finalUpi  = (upiId || req.saathi.payout?.upiId || '').trim();
  const finalBank = bank || req.saathi.payout?.bank || {};

  if (method === 'upi') {
    if (!UPI_REGEX.test(finalUpi)) {
      return res.status(400).json({ success: false, message: 'Valid UPI ID daalo (jaise name@upi).' });
    }
  } else {
    if (!finalBank.accountNumber || !finalBank.ifscCode || !finalBank.accountHolderName) {
      return res.status(400).json({ success: false, message: 'Bank account number, IFSC aur account holder name zaruri hai.' });
    }
    if (!IFSC_REGEX.test(String(finalBank.ifscCode).toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Valid IFSC code daalo.' });
    }
  }

  const balance = await getBalance(req.saathi._id);
  if (value > balance.available) {
    return res.status(400).json({
      success: false,
      message: `Sirf ₹${balance.available} withdraw ho sakta hai. Pending incentives admin approve karne ke baad hi milte hain.`,
    });
  }

  // Koi earning row lock nahi hoti. Ye request khud ek debit hai — jab tak
  // reject na ho, getBalance ise available se ghata deta hai.
  const withdrawal = await SaathiWithdrawal.create({
    saathi: req.saathi._id,
    amount: value,
    method,
    upiId:  method === 'upi' ? finalUpi : '',
    bank:   method === 'bank' ? { ...finalBank, ifscCode: String(finalBank.ifscCode).toUpperCase() } : {},
    status: 'pending',
  });

  return res.status(201).json({
    success: true,
    message: 'Withdrawal request bhej di gayi. Admin review ke baad payout hoga.',
    data: {
      id:     withdrawal._id,
      amount: withdrawal.amount,
      method: withdrawal.method,
      status: withdrawal.status,
    },
  });
};

module.exports = { getWithdrawals, requestWithdrawal };
