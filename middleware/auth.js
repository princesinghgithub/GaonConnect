const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect — JWT access token verify karo ──────────────────────────────────
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. Token required.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password -otp -otpExpiry');

    // User delete ho gaya ho ya na mile
    if (!user) {
      return res.status(401).json({ success: false, message: 'User nahi mila. Dobara login karo.' });
    }

    // Blocked user check (agar future mein isBlocked field add karo)
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account block kar diya gaya hai.' });
    }

    req.user = user;
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

// ─── admin — sirf admin role allow karo ──────────────────────────────────────
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

// ─── provider — sirf provider role allow karo ────────────────────────────────
const providerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'provider') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Provider access required.' });
};

// ─── customer — sirf customer role allow karo ────────────────────────────────
const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Customer access required.' });
};

module.exports = { protect, admin, providerOnly, customerOnly };
