const mongoose = require('mongoose');

const Saathi           = require('../models/Saathi');
const SaathiReferral   = require('../models/SaathiReferral');
const SaathiEarning    = require('../models/SaathiEarning');
const SaathiWithdrawal = require('../models/SaathiWithdrawal');
const { getBalance, runRewardSweep } = require('../services/rewards');

// Admin side bhi isi module mein rakhi gayi hai — Saathi ka saara code ek
// folder mein. Auth ke liye main app ki `protect` + `admin` middleware hi
// chalti hai, alag admin login banane ki zarurat nahi.

const parsePaging = (query) => {
  const page  = Math.max(1, parseInt(query.page, 10)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const badId = (res) => res.status(400).json({ success: false, message: 'Invalid id.' });

// ─── GET /api/saathi/admin/list ──────────────────────────────────────────────
const listSaathis = async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const term = String(req.query.search).trim();
    filter.$or = [
      { name:       new RegExp(term, 'i') },
      { phone:      new RegExp(term, 'i') },
      { saathiCode: new RegExp(term, 'i') },
      { village:    new RegExp(term, 'i') },
    ];
  }

  const [total, rows] = await Promise.all([
    Saathi.countDocuments(filter),
    Saathi.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return res.json({
    success: true,
    data: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── GET /api/saathi/admin/:id ───────────────────────────────────────────────
const getSaathi = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);

  const saathi = await Saathi.findById(req.params.id);
  if (!saathi) return res.status(404).json({ success: false, message: 'Saathi nahi mila.' });

  const [drivers, customers, activations, balance] = await Promise.all([
    SaathiReferral.countDocuments({ saathi: saathi._id, type: 'driver' }),
    SaathiReferral.countDocuments({ saathi: saathi._id, type: 'customer' }),
    SaathiReferral.countDocuments({ saathi: saathi._id, status: 'activated' }),
    getBalance(saathi._id),
  ]);

  return res.json({
    success: true,
    data: { saathi, stats: { drivers, customers, activations }, balance },
  });
};

// ─── PATCH /api/saathi/admin/:id/status ──────────────────────────────────────
const setStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);

  const { status, reason } = req.body;
  if (!['pending', 'active', 'suspended'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status 'pending', 'active' ya 'suspended' hona chahiye.",
    });
  }

  const update = { status };
  if (status === 'active') {
    update.approvedAt  = new Date();
    update.approvedBy  = req.user._id;
    update.isBlocked   = false;
    update.blockReason = '';
  }
  if (status === 'suspended') {
    update.isBlocked   = true;
    update.blockReason = reason || 'Admin ne suspend kiya.';
  }

  const saathi = await Saathi.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!saathi) return res.status(404).json({ success: false, message: 'Saathi nahi mila.' });

  return res.json({ success: true, message: `Saathi ${status} kar diya gaya.`, data: saathi });
};

// ─── GET /api/saathi/admin/earnings ──────────────────────────────────────────
const listEarnings = async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { status: req.query.status || 'pending' };

  const [total, rows] = await Promise.all([
    SaathiEarning.countDocuments(filter),
    SaathiEarning.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('saathi', 'name phone saathiCode village'),
  ]);

  return res.json({
    success: true,
    data: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── PATCH /api/saathi/admin/earnings/:id ────────────────────────────────────
const reviewEarning = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);

  const { action, remarks } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: "action 'approve' ya 'reject' hona chahiye." });
  }

  const earning = await SaathiEarning.findById(req.params.id);
  if (!earning) return res.status(404).json({ success: false, message: 'Earning nahi mili.' });

  // Approved earning ko reject karna tabhi theek hai jab utna paisa abhi
  // balance mein pada ho. Nikala ja chuka paisa wapas nahi le sakte — warna
  // balance negative ho jaata aur hisaab ulta pad jaata.
  if (action === 'reject' && earning.status === 'approved') {
    const balance = await getBalance(earning.saathi);
    if (balance.available < earning.amount) {
      return res.status(400).json({
        success: false,
        message: `Ye ₹${earning.amount} nikala ja chuka hai, isliye reject nahi ho sakta. Available balance sirf ₹${balance.available} hai.`,
      });
    }
  }

  earning.status  = action === 'approve' ? 'approved' : 'rejected';
  earning.remarks = remarks || '';
  earning[action === 'approve' ? 'approvedAt' : 'rejectedAt'] = new Date();
  await earning.save();

  return res.json({ success: true, message: `Earning ${earning.status} kar di gayi.`, data: earning });
};

// ─── GET /api/saathi/admin/withdrawals ───────────────────────────────────────
const listWithdrawals = async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [total, rows] = await Promise.all([
    SaathiWithdrawal.countDocuments(filter),
    SaathiWithdrawal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('saathi', 'name phone saathiCode village payout'),
  ]);

  return res.json({
    success: true,
    data: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── PATCH /api/saathi/admin/withdrawals/:id ─────────────────────────────────
// approve — paisa bhejne ke liye taiyaar
// paid    — paisa bhej diya
// reject  — request cancel; paisa wapas available balance mein aa jaata hai
//
// Earnings ko yahan chhedne ki zarurat nahi — withdrawal khud debit hai, aur
// getBalance use apne aap ghata/jod leta hai.
const reviewWithdrawal = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);

  const { action, remarks, utr } = req.body;
  if (!['approve', 'reject', 'paid'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "action 'approve', 'reject' ya 'paid' hona chahiye.",
    });
  }

  const withdrawal = await SaathiWithdrawal.findById(req.params.id);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal nahi mili.' });
  if (withdrawal.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Ye withdrawal pehle hi paid hai.' });
  }

  withdrawal.status = action === 'approve' ? 'approved'
                    : action === 'paid'    ? 'paid'
                    : 'rejected';
  withdrawal.remarks     = remarks || withdrawal.remarks;
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  if (utr) withdrawal.utr = String(utr).trim();
  await withdrawal.save();

  return res.json({ success: true, message: `Withdrawal ${withdrawal.status} kar di gayi.`, data: withdrawal });
};

// ─── POST /api/saathi/admin/run-rewards ──────────────────────────────────────
// Cron khud chalta hai; ye manual trigger testing aur "abhi chahiye" ke liye hai.
const runRewards = async (_req, res) => {
  const summary = await runRewardSweep();
  return res.json({ success: true, message: 'Reward sweep complete.', data: summary });
};

module.exports = {
  listSaathis,
  getSaathi,
  setStatus,
  listEarnings,
  reviewEarning,
  listWithdrawals,
  reviewWithdrawal,
  runRewards,
};
