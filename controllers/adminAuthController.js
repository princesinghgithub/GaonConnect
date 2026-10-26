const crypto    = require('crypto');
const bcrypt    = require('bcryptjs');
const User      = require('../models/User');
const AdminAuth = require('../models/AdminAuth');
const redis     = require('../config/redis');
const totp      = require('../utils/totp');
const { generateAccessToken, generateRefreshToken, saveRefreshToken, revokeAllUserTokens } = require('../utils/tokenService');

// ─── Admin Login: Email + Password + Google Authenticator ────────────────────
// Flow:
//   1. POST /login      { email, password }        → { step: 'totp' | 'setup', challenge }
//   2a. POST /verify-2fa { challenge, code }       → tokens   (code = 6-digit ya backup code)
//   2b. POST /setup-2fa  { challenge, code }       → tokens + backupCodes (sirf pehli baar)
// Password sahi hone pe token nahi milta — sirf 5 minute ka "challenge" milta hai,
// jo Redis mein rehta hai. JWT isliye nahi banaya kyunki `protect` middleware
// JWT_SECRET se sign hua koi bhi token maan leta, yaani adha-login bhi poora ho jaata.

const isDev = process.env.NODE_ENV !== 'production';

const ISSUER                 = 'GaonConnect Admin';
const MIN_PASSWORD_LENGTH    = 10;
const MAX_FAILED_LOGINS      = 5;
const LOCK_MINUTES           = 15;
const CHALLENGE_TTL_SECONDS  = 5 * 60;
const MAX_CHALLENGE_ATTEMPTS = 5;
const BACKUP_CODE_COUNT      = 10;
const BACKUP_ALPHABET        = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0/O, 1/I jaise confusing letters nahi

// Email na mile tab bhi bcrypt chalao — warna fast response se pata chal jaata
// ki kaunsa email admin hai aur kaunsa nahi
const DUMMY_HASH = bcrypt.hashSync('gaonconnect-timing-dummy', 10);

// ─── Challenge (password ke baad, 2FA se pehle) ──────────────────────────────
const challengeKey = (id) => `admin_2fa:${id}`;

const createChallenge = async (userId) => {
  const id = crypto.randomBytes(32).toString('hex');
  await redis.setex(challengeKey(id), CHALLENGE_TTL_SECONDS, JSON.stringify({ userId: userId.toString(), attempts: 0 }));
  return id;
};

const readChallenge = async (id) => {
  if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) return null;
  const raw = await redis.get(challengeKey(id));
  return raw ? JSON.parse(raw) : null;
};

// Galat code pe attempt badhao; limit poori to challenge khatam — dobara password daalna padega
const failChallenge = async (id, challenge) => {
  challenge.attempts += 1;
  const left = MAX_CHALLENGE_ATTEMPTS - challenge.attempts;
  if (left <= 0) {
    await redis.del(challengeKey(id));
  } else {
    const ttl = await redis.ttl(challengeKey(id));
    if (ttl > 0) await redis.setex(challengeKey(id), ttl, JSON.stringify(challenge));
  }
  return left;
};

const wrongCodeResponse = (res, left) =>
  res.status(400).json({
    success: false,
    message: left > 0
      ? `Code galat hai. ${left} aur attempts baaki hain.`
      : 'Bahut zyada galat code. Dobara login karo.',
    ...(left <= 0 && { code: 'CHALLENGE_EXPIRED' }),
  });

const expiredResponse = (res) =>
  res.status(401).json({ success: false, message: 'Session expire ho gaya. Dobara login karo.', code: 'CHALLENGE_EXPIRED' });

// ─── Backup codes ─────────────────────────────────────────────────────────────
const generateBackupCodes = () =>
  Array.from({ length: BACKUP_CODE_COUNT }, () => {
    let s = '';
    for (let i = 0; i < 8; i++) s += BACKUP_ALPHABET[crypto.randomInt(BACKUP_ALPHABET.length)];
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });

// Codes random aur lambe hain, isliye bcrypt ki zaroorat nahi — SHA-256 kaafi hai
const hashBackupCode = (code) =>
  crypto.createHash('sha256').update(String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')).digest('hex');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const findActiveAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'admin' || user.isBlocked) return null;
  return user;
};

const buildTokenResponse = async (user) => {
  const accessToken  = generateAccessToken(user._id, 'admin');
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user._id, refreshToken, 'admin');

  return {
    accessToken,
    refreshToken,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone,
      role:       'admin',
      roles:      user.roles || [user.role],
      city:       user.city,
      isVerified: user.isVerified,
    },
  };
};

const validateNewPassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password kam se kam ${MIN_PASSWORD_LENGTH} characters ka hona chahiye`;
  }
  if (password.length > 128) return 'Password bahut lamba hai';
  return null;
};

// Atomic — do requests ek saath same code bhejein to bhi sirf ek chalega
const consumeTotpStep = async (authId, step) => {
  const result = await AdminAuth.updateOne(
    { _id: authId, lastTotpStep: { $lt: step } },
    { $set: { lastTotpStep: step } }
  );
  return result.modifiedCount === 1;
};

const consumeBackupCode = async (authId, code) => {
  const hash = hashBackupCode(code);
  const result = await AdminAuth.updateOne(
    { _id: authId, backupCodes: hash },
    { $pull: { backupCodes: hash } }
  );
  return result.modifiedCount === 1;
};

// ─── STEP 1: Email + Password ─────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const email    = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email aur password dono daalo' });
    }

    const user = await User.findOne({ email, role: 'admin' });
    const auth = user ? await AdminAuth.findOne({ user: user._id }).select('+passwordHash') : null;

    if (auth?.lockUntil && auth.lockUntil > new Date()) {
      const mins = Math.ceil((auth.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Bahut zyada galat attempts. ${mins} minute baad try karo.` });
    }

    const ok = await bcrypt.compare(password, auth?.passwordHash || DUMMY_HASH);

    if (!user || !auth?.passwordHash || !ok) {
      if (auth) {
        auth.failedLogins += 1;
        if (auth.failedLogins >= MAX_FAILED_LOGINS) {
          auth.lockUntil    = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
          auth.failedLogins = 0;
        }
        await auth.save();
      }
      return res.status(401).json({ success: false, message: 'Email ya password galat hai' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account block kar diya gaya hai.' });
    }

    if (auth.failedLogins || auth.lockUntil) {
      auth.failedLogins = 0;
      auth.lockUntil    = undefined;
    }

    const challenge = await createChallenge(user._id);

    if (auth.totpEnabled) {
      await auth.save();
      return res.status(200).json({ success: true, step: 'totp', challenge });
    }

    // Pehli baar — Google Authenticator setup. QR (otpauthUrl) dashboard dikhayega,
    // `secret` un logon ke liye jo QR scan na kar paayein aur haath se daalein.
    const secret = totp.generateSecret();
    auth.pendingTotpSecret = secret;
    await auth.save();

    return res.status(200).json({
      success: true,
      step: 'setup',
      challenge,
      secret,
      otpauthUrl: totp.buildOtpAuthUrl({ secret, account: user.email, issuer: ISSUER }),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── STEP 2 (pehli baar): Authenticator setup confirm ────────────────────────
exports.setup2fa = async (req, res) => {
  try {
    const { challenge: id, code } = req.body || {};
    const challenge = await readChallenge(id);
    if (!challenge) return expiredResponse(res);

    const user = await findActiveAdmin(challenge.userId);
    const auth = await AdminAuth.findOne({ user: challenge.userId }).select('+pendingTotpSecret');
    if (!user || !auth) return expiredResponse(res);

    if (auth.totpEnabled || !auth.pendingTotpSecret) {
      return res.status(400).json({ success: false, message: 'Authenticator pehle se set hai. Dobara login karo.', code: 'CHALLENGE_EXPIRED' });
    }

    const step = totp.verify(auth.pendingTotpSecret, code);
    if (step === null) return wrongCodeResponse(res, await failChallenge(id, challenge));

    const backupCodes = generateBackupCodes();
    auth.totpSecret        = auth.pendingTotpSecret;
    auth.pendingTotpSecret = undefined;
    auth.totpEnabled       = true;
    auth.lastTotpStep      = step;
    auth.backupCodes       = backupCodes.map(hashBackupCode);
    await auth.save();

    await redis.del(challengeKey(id));
    const payload = await buildTokenResponse(user);

    res.status(200).json({
      success: true,
      message: 'Google Authenticator set ho gaya! Backup codes safe jagah save kar lo — yeh dobara nahi dikhenge.',
      backupCodes,
      ...payload,
    });
  } catch (error) {
    console.error('Admin setup-2fa error:', error);
    res.status(500).json({ success: false, message: 'Setup mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── STEP 2: Authenticator code ya backup code ───────────────────────────────
exports.verify2fa = async (req, res) => {
  try {
    const { challenge: id, code } = req.body || {};
    const challenge = await readChallenge(id);
    if (!challenge) return expiredResponse(res);

    const user = await findActiveAdmin(challenge.userId);
    const auth = await AdminAuth.findOne({ user: challenge.userId }).select('+totpSecret');
    if (!user || !auth?.totpEnabled) return expiredResponse(res);

    const input = String(code || '').trim();
    let usedBackupCode = false;

    if (/^\d{6}$/.test(input)) {
      const step = totp.verify(auth.totpSecret, input);
      if (step === null || !(await consumeTotpStep(auth._id, step))) {
        return wrongCodeResponse(res, await failChallenge(id, challenge));
      }
    } else {
      if (!(await consumeBackupCode(auth._id, input))) {
        return wrongCodeResponse(res, await failChallenge(id, challenge));
      }
      usedBackupCode = true;
    }

    await redis.del(challengeKey(id));
    const payload = await buildTokenResponse(user);

    let backupCodesLeft;
    if (usedBackupCode) {
      const fresh = await AdminAuth.findById(auth._id).select('+backupCodes');
      backupCodesLeft = fresh.backupCodes.length;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      ...(usedBackupCode && { backupCodesLeft }),
      ...payload,
    });
  } catch (error) {
    console.error('Admin verify-2fa error:', error);
    res.status(500).json({ success: false, message: 'Verify mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── Status (logged-in admin) ─────────────────────────────────────────────────
// Dashboard isse "backup codes khatam ho rahe hain" jaisi warning dikha sakta hai
exports.status = async (req, res) => {
  try {
    const auth = await AdminAuth.findOne({ user: req.user._id }).select('+backupCodes');
    res.status(200).json({
      success: true,
      totpEnabled:       !!auth?.totpEnabled,
      backupCodesLeft:   auth?.backupCodes?.length || 0,
      passwordChangedAt: auth?.passwordChangedAt || null,
    });
  } catch (error) {
    console.error('Admin auth status error:', error);
    res.status(500).json({ success: false, message: 'Status laane mein error' });
  }
};

// ─── Change Password (logged-in admin) ───────────────────────────────────────
// Password badalne pe baaki sab devices logout — purana password leak hua ho to
// uske session bhi band. Is device ke liye naye tokens wapas milte hain.
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    const invalid = validateNewPassword(newPassword);
    if (invalid) return res.status(400).json({ success: false, message: invalid });

    const auth = await AdminAuth.findOne({ user: req.user._id }).select('+passwordHash');
    if (!auth?.passwordHash || !(await bcrypt.compare(String(currentPassword || ''), auth.passwordHash))) {
      return res.status(400).json({ success: false, message: 'Purana password galat hai' });
    }
    if (await bcrypt.compare(newPassword, auth.passwordHash)) {
      return res.status(400).json({ success: false, message: 'Naya password purane se alag hona chahiye' });
    }

    auth.passwordHash      = await bcrypt.hash(newPassword, 12);
    auth.passwordChangedAt = new Date();
    await auth.save();

    await revokeAllUserTokens(req.user._id);
    const payload = await buildTokenResponse(req.user);

    res.status(200).json({ success: true, message: 'Password badal diya gaya. Baaki devices se logout ho gaye.', ...payload });
  } catch (error) {
    console.error('Admin change-password error:', error);
    res.status(500).json({ success: false, message: 'Password badalne mein error' });
  }
};

// ─── Naye Backup Codes (logged-in admin) ─────────────────────────────────────
// Purane sab codes cancel. Authenticator ka current code chahiye — taaki
// sirf khula laptop mil jaane se koi naye codes na bana le.
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const { code } = req.body || {};
    const auth = await AdminAuth.findOne({ user: req.user._id }).select('+totpSecret');
    if (!auth?.totpEnabled) {
      return res.status(400).json({ success: false, message: 'Pehle Google Authenticator set karo' });
    }

    const step = totp.verify(auth.totpSecret, code);
    if (step === null || !(await consumeTotpStep(auth._id, step))) {
      return res.status(400).json({ success: false, message: 'Authenticator code galat hai' });
    }

    const backupCodes = generateBackupCodes();
    await AdminAuth.updateOne({ _id: auth._id }, { $set: { backupCodes: backupCodes.map(hashBackupCode) } });

    res.status(200).json({
      success: true,
      message: 'Naye backup codes ban gaye. Purane ab kaam nahi karenge.',
      backupCodes,
    });
  } catch (error) {
    console.error('Admin regenerate-backup-codes error:', error);
    res.status(500).json({ success: false, message: 'Backup codes banane mein error' });
  }
};
