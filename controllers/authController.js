const User = require('../models/User');
const Provider = require('../models/Provider');
const { sendOTP, verifyOTP, normalizePhone } = require('../utils/sendOTP');
const { generateAccessToken, generateRefreshToken, saveRefreshToken } = require('../utils/tokenService');
const { sendEmail } = require('../utils/mailer');

const isDev = process.env.NODE_ENV !== 'production';

const generateOTP = () => {
  const crypto = require('crypto');
  return crypto.randomInt(100000, 999999).toString();
};

const sendOtpViaEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'Your OTP for GaonConnect',
    text: `Your OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
  });
};

const buildTokenResponse = async (user, providerData = null, activeRole = null) => {
  const role        = activeRole || user.role;
  const accessToken  = generateAccessToken(user._id, role);
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user._id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone,
      role,                         // active role (jis app se login kiya)
      roles:      user.roles || [user.role], // dono roles
      city:       user.city,
      isVerified: user.isVerified,
    },
    ...(providerData && { provider: providerData }),
  };
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, phone, email, city, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser)
      return res.status(400).json({ success: false, message: 'Is phone ya email se account already exist karta hai' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.create({ name, phone, email, city: city || '', role: role || 'customer', otp, otpExpiry, isVerified: false });

    if (!isDev) {
      await sendOtpViaEmail(email, otp);
    } else {
      console.log(`\n🎉 [DEV] New User: ${name}\n📱 OTP: ${otp}\n`);
    }

    res.status(201).json({
      success: true,
      message: 'User registered! OTP bheja gaya.',
      ...(isDev && { otp }),
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Registration mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── SEND EMAIL OTP ─────────────────────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(404).json({ success: false, message: 'Koi account nahi mila. Pehle register karo.' });

    if (user.role === 'provider') {
      const provider = await Provider.findOne({ user: user._id });
      if (!provider) return res.status(404).json({ success: false, message: 'Provider profile nahi mili' });
      if (!provider.isApproved)
        return res.status(403).json({ success: false, message: 'Aapka account abhi admin se approve nahi hua.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (!isDev) {
      await sendOtpViaEmail(email, otp);
    } else {
      console.log(`\n📱 [DEV] OTP for ${email}: ${otp}\n`);
    }

    res.status(200).json({
      success: true,
      message: 'OTP bhej diya gaya',
      ...(isDev && { otp }),
    });
  } catch (error) {
    console.error('SendOTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP bhejne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── VERIFY EMAIL OTP ────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User nahi mila' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'OTP galat hai' });
    if (new Date() > user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP expire ho gaya. Dobara bhejo.' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    let providerData = null;
    if (user.role === 'provider') {
      providerData = await Provider.findOne({ user: user._id })
        .select('vehicle documents rating stats status isApproved isOnline wallet');
    }

    const payload = await buildTokenResponse(user, providerData);
    res.status(200).json({ success: true, message: 'Login successful!', ...payload });
  } catch (error) {
    console.error('VerifyOTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP verify karne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── SEND PHONE OTP ──────────────────────────────────────────────────────────
exports.sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const result = await sendOTP(phone);
    if (!result.success) return res.status(400).json({ success: false, message: result.message });

    res.status(200).json({
      success: true,
      message: 'OTP bhej diya gaya',
      phone: result.phone,
      ...(isDev && { otp: result.otp }),
    });
  } catch (error) {
    console.error('sendPhoneOTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP bhejne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── VERIFY PHONE OTP ────────────────────────────────────────────────────────
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, otp, name, city, email, role } = req.body;

    const verification = await verifyOTP(phone, otp);
    if (!verification.success)
      return res.status(400).json({ success: false, message: verification.message });

    const normalized = normalizePhone(phone);
    const tenDigit = normalized.slice(-10);

    let user = await User.findOne({ phone: tenDigit });
    const activeRole = role || 'customer';

    if (!user) {
      // Naya user — jis app se aaya uska role set karo
      const fallbackName = name || `User${tenDigit.slice(-4)}`;
      user = await User.create({
        name:       fallbackName,
        phone:      tenDigit,
        email:      email || undefined,
        city:       city || '',
        role:       activeRole,
        roles:      [activeRole],
        isVerified: true,
      });
    } else {
      // Existing user — roles array mein add karo agar nahi hai
      let changed = false;
      if (!user.isVerified) { user.isVerified = true; changed = true; }

      if (!user.roles) user.roles = [user.role];

      if (!user.roles.includes(activeRole)) {
        user.roles.push(activeRole);
        changed = true;
      }
      if (changed) await user.save();
    }

    // Provider App se login — approval check
    if (activeRole === 'provider') {
      const provider = await Provider.findOne({ user: user._id });
      if (!provider)
        return res.status(404).json({ success: false, message: 'Driver profile nahi mili. Pehle register karo.' });
      if (!provider.isApproved)
        return res.status(403).json({ success: false, message: 'Aapka account abhi admin se approve nahi hua.' });
    }

    let providerData = null;
    if (activeRole === 'provider') {
      providerData = await Provider.findOne({ user: user._id })
        .select('vehicle documents rating stats status isApproved isOnline wallet');
    }

    const payload = await buildTokenResponse(user, providerData, activeRole);
    res.status(200).json({ success: true, message: 'Login successful!', ...payload });
  } catch (error) {
    console.error('verifyPhoneOTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP verify karne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── GET PROFILE ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile fetch karne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, city } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User nahi mila' });

    if (name)  user.name  = name;
    if (email) user.email = email;
    if (city)  user.city  = city;
    await user.save();

    res.status(200).json({ success: true, message: 'Profile update ho gaya!', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile update mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── UPLOAD PROFILE PHOTO ─────────────────────────────────────────────────────
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Photo upload karo' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User nahi mila' });

    user.profilePhoto = req.file.path; // Cloudinary secure URL
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo update ho gaya!',
      data: { profilePhoto: user.profilePhoto },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Photo upload mein error', ...(isDev && { error: error.message }) });
  }
};
