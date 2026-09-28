const SaathiEarning  = require('../models/SaathiEarning');
const { getBalance } = require('../services/rewards');

// ─── GET /api/saathi/earnings ────────────────────────────────────────────────
// Summary cards + ledger, ek call mein.
const getEarnings = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip  = (page - 1) * limit;

  const filter = { saathi: req.saathi._id };
  if (req.query.status) filter.status = req.query.status;

  const [balance, total, rows] = await Promise.all([
    getBalance(req.saathi._id),
    SaathiEarning.countDocuments(filter),
    SaathiEarning.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return res.json({
    success: true,
    data: {
      summary: balance,
      ledger: rows.map((row) => ({
        id:        row._id,
        date:      row.createdAt,
        type:      row.type,
        reason:    row.reason,
        reference: row.reference,
        amount:    row.amount,
        status:    row.status,
        remarks:   row.remarks || '',
      })),
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

module.exports = { getEarnings };
