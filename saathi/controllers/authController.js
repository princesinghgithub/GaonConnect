const Saathi = require('../models/Saathi');
const { sendOTP, verifyOTP, normalizePhone } = require('../../utils/sendOTP');
const { generateSaathiCode, buildSaathiId }  = require('../utils/code');
const tokens = require('../utils/saathiToken');

const isDev = process.env.NODE_ENV !== 'production';

// Saathi ka public profile — login/refresh/profile sab yahi shape lautate hain,
// taaki portal ko har jagah alag parsing na karni pade.
const publicProfile = (saathi) => ({
  id:         saathi._id,
  name:       saathi.name,
  phone:      saathi.phone,
  email:      saathi.email || '',
  village:    saathi.village,
  district:   saathi.district,
  state:      saathi.state,
  saathiCode: saathi.saathiCode,
  saathiId:   saathi.saathiId,
  status:     saathi.status,
  language:   saathi.language,
  payout: {
    method: saathi.payout?.method || 'upi',
    upiId:  saathi.payout?.upiId  || '',
    bank:   saathi.payout?.bank   || {},
  },
});

// ─── POST /api/saathi/auth/send-otp ──────────────────────────────────────────
const sendLoginOtp = async (req, res) => {
  const { phone } = req.body;

  const result = await sendOTP(phone);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  const tenDigit = String(result.phone).slice(-10);
  const exists   = await Saathi.exists({ phone: tenDigit });

  return res.json({
    success:      true,
    message:      'OTP bhej diya gaya',
    phone:        result.phone,
    isRegistered: Boolean(exists), // portal decide kare: login form ya register form
    ...(isDev && { otp: result.otp }),
  });
};

// ─── POST /api/saathi/auth/verify-otp ────────────────────────────────────────
// Login + pehli baar ka registration dono yahin. Naya Saathi 'pending' banta
// hai — login ho jaata hai, par referral/earnings admin approval ke baad.
const verifyLoginOtp = async (req, res) => {
  const { phone, otp, name, village, district, state, email } = req.body;

  const verification = await verifyOTP(phone, otp);
  if (!verification.success) {
    return res.status(400).json({ success: false, message: verification.message });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number daalo.' });
  }
  const tenDigit = normalized.slice(-10);

  let saathi     = await Saathi.findOne({ phone: tenDigit });
  const isNew    = !saathi;

  if (!saathi) {
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success:        false,
        message:        'Naya Saathi account banane ke liye naam chahiye.',
        code:           'NAME_REQUIRED',
        needsOnboarding: true,
      });
    }

    const saathiCode = await generateSaathiCode(village);

    saathi = await Saathi.create({
      name:     String(name).trim(),
      phone:    tenDigit,
      email:    email ? String(email).trim().toLowerCase() : undefined,
      village:  village  || '',
      district: district || '',
      state:    state    || '',
      saathiCode,
      saathiId: buildSaathiId(saathiCode),
      status:   'pending',
    });
  }

  if (saathi.isBlocked) {
    return res.status(403).json({
      success: false,
      message: saathi.blockReason || 'Aapka Saathi account block kar diya gaya hai.',
    });
  }

  saathi.lastLoginAt = new Date();
  await saathi.save();

  const session = await tokens.issueSession(saathi);

  return res.json({
    success: true,
    message: isNew ? 'Saathi account ban gaya! Admin verify karega.' : 'Login successful!',
    isNewSaathi: isNew,
    ...session,
    saathi: publicProfile(saathi),
  });
};

// ─── POST /api/saathi/auth/refresh ───────────────────────────────────────────
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'refreshToken required hai.' });
  }

  const rotated = await tokens.rotateRefreshToken(refreshToken);
  if (!rotated) {
    return res.status(401).json({ success: false, message: 'Session expire ho gaya. Dobara login karo.', code: 'TOKEN_EXPIRED' });
  }

  const saathi = await Saathi.findById(rotated.saathiId);
  if (!saathi || saathi.isBlocked) {
    await tokens.revokeRefreshToken(rotated.newToken);
    return res.status(401).json({ success: false, message: 'Account available nahi hai. Dobara login karo.' });
  }

  return res.json({
    success:      true,
    accessToken:  tokens.generateAccessToken(saathi._id),
    refreshToken: rotated.newToken,
    expiresIn:    tokens.ACCESS_TOKEN_EXPIRY_SEC,
    saathi:       publicProfile(saathi),
  });
};

// ─── POST /api/saathi/auth/logout ────────────────────────────────────────────
const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await tokens.revokeRefreshToken(refreshToken);
  return res.json({ success: true, message: 'Logout ho gaya.' });
};

// ─── POST /api/saathi/auth/logout-all ────────────────────────────────────────
const logoutAll = async (req, res) => {
  await tokens.revokeAllTokens(req.saathi._id);
  return res.json({ success: true, message: 'Sabhi devices se logout ho gaya.' });
};

// ─── GET /api/saathi/auth/me ─────────────────────────────────────────────────
const me = async (req, res) => res.json({ success: true, saathi: publicProfile(req.saathi) });

module.exports = { sendLoginOtp, verifyLoginOtp, refresh, logout, logoutAll, me, publicProfile };
