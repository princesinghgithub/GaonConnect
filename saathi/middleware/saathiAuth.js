const jwt    = require('jsonwebtoken');
const Saathi = require('../models/Saathi');

// ─── saathiProtect — sirf Saathi portal ke token chalte hain ─────────────────
const saathiProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Login required. Token bhejo.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token missing hai.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Driver/customer ka token yahan nahi chalna chahiye. JWT_SECRET same hai,
    // isliye ye check hi dono duniya ko alag rakhta hai.
    if (decoded.typ !== 'saathi') {
      return res.status(403).json({ success: false, message: 'Ye token Saathi portal ke liye nahi hai.' });
    }

    const saathi = await Saathi.findById(decoded.id);
    if (!saathi) {
      return res.status(401).json({ success: false, message: 'Saathi account nahi mila. Dobara login karo.' });
    }
    if (saathi.isBlocked) {
      return res.status(403).json({
        success: false,
        message: saathi.blockReason || 'Aapka Saathi account block kar diya gaya hai.',
      });
    }

    req.saathi = saathi;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expire ho gaya. Dobara login karo.', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.', code: 'TOKEN_INVALID' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

// ─── saathiActive — pending/suspended Saathi ko kaam karne se roko ───────────
// Login allow hai (taaki apna status aur support dekh sake), par referral,
// earnings aur withdraw jaisi cheezein sirf active Saathi ke liye.
const saathiActive = (req, res, next) => {
  if (req.saathi?.status === 'active') return next();

  const message = req.saathi?.status === 'suspended'
    ? 'Aapka Saathi account suspend hai. Support se baat karein.'
    : 'Aapka account abhi verify nahi hua. Admin approve karega tab ye feature khulega.';

  return res.status(403).json({ success: false, message, code: 'SAATHI_NOT_ACTIVE' });
};

module.exports = { saathiProtect, saathiActive };
