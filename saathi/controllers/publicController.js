const Saathi = require('../models/Saathi');
const { claimReferral } = require('../services/attribution');
const { normalizeCode } = require('../utils/code');

// Ye do endpoints driver/user app ke liye hain, portal ke liye nahi.

// ─── GET /api/saathi/public/verify-code?code=MAU001 ──────────────────────────
// App signup screen par dikhata hai: "Aapko <naam> ne refer kiya hai" —
// taaki galat code type hone par user ko wahin pata chal jaaye.
const verifyCode = async (req, res) => {
  const code = normalizeCode(req.query.code);
  if (!code) return res.status(400).json({ success: false, message: 'code query param chahiye.' });

  const saathi = await Saathi.findOne({ saathiCode: code }).select('name village district status isBlocked');

  const valid = Boolean(saathi) && saathi.status === 'active' && !saathi.isBlocked;

  return res.json({
    success: true,
    valid,
    ...(valid && {
      saathi: {
        name: saathi.name,
        area: [saathi.village, saathi.district].filter(Boolean).join(', '),
      },
    }),
    ...(!valid && { message: 'Ye referral code valid nahi hai.' }),
  });
};

// ─── POST /api/saathi/public/claim ───────────────────────────────────────────
// Driver/User app signup ke turant baad ye call karti hai.
//
// Ye alag endpoint isliye hai taaki auth aur provider registration ka purana
// code chhedna na pade — Saathi module ka koi bug signup ko nahi tod sakta.
// Idempotent hai: dobara call karne par naya referral nahi banta.
const claim = async (req, res) => {
  const { code, phone, type } = req.body;

  const result = await claimReferral({ code, phone, type });

  // 'claimed_by_other' aur 'already_claimed' failure nahi hain — app ko
  // signup rokna nahi chahiye, bas message dikhana hai.
  const status = result.ok || result.status === 'claimed_by_other' ? 200 : 400;

  return res.status(status).json({
    success: result.ok,
    status:  result.status,
    message: result.message,
  });
};

module.exports = { verifyCode, claim };
