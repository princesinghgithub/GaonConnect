// utils/referral.js
// Refer & Earn. Gaon mein app zyadatar mooh-zubani failti hai, isliye yeh
// sabse sasta growth channel hai — har user apna code share karta hai.
//
// Reward sign-up pe NAHI, referee ki pehli COMPLETED ride ke baad milta hai.
// Sign-up pe dene se log fake numbers se account bana bana ke wallet bhar lete
// hain; pehli ride pe dene se asli sawari honi zaroori ho jaati hai.
const crypto      = require('crypto');
const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const { getSettings } = require('./dynamicFare');

// I, O, 0, 1 jaan-bujhkar nahi rakhe — log code phone pe likhte/bolte hain aur
// yeh chaar aapas mein confuse hote hain.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 6;

const randomCode = () => {
  const bytes = crypto.randomBytes(CODE_LEN);
  let out = '';
  for (let i = 0; i < CODE_LEN; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
};

/**
 * User ke liye referral code banao (agar pehle se na ho).
 * Collision par dobara koshish — 32^6 space hai, practically kabhi nahi hoga,
 * par unique index ke saath race ho sakti hai isliye retry rakha hai.
 */
const ensureReferralCode = async (userId) => {
  const user = await User.findById(userId).select('referralCode');
  if (!user) return null;
  if (user.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    try {
      await User.findByIdAndUpdate(userId, { $set: { referralCode: code } });
      return code;
    } catch (err) {
      if (err.code !== 11000) throw err; // duplicate key ke alawa kuch aur — aage bhejo
    }
  }
  return null;
};

/**
 * Naye user pe kisi ka referral code lagao.
 * Sirf tab tak chalega jab tak us user ne koi ride complete na ki ho.
 */
const applyReferralCode = async (userId, rawCode) => {
  const settings = await getSettings();
  if (settings?.referral?.enabled === false) {
    return { ok: false, message: 'Referral abhi band hai' };
  }

  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, message: 'Referral code daalein' };

  const user = await User.findById(userId).select('referredBy referralCode referralRewarded');
  if (!user) return { ok: false, message: 'User nahi mila' };

  if (user.referredBy) {
    return { ok: false, message: 'Aap pehle hi ek referral code laga chuke hain' };
  }
  if (user.referralCode && user.referralCode === code) {
    return { ok: false, message: 'Apna hi code nahi laga sakte' };
  }

  const referrer = await User.findOne({ referralCode: code }).select('_id');
  if (!referrer) return { ok: false, message: 'Yeh code sahi nahi hai' };

  if (referrer._id.toString() === userId.toString()) {
    return { ok: false, message: 'Apna hi code nahi laga sakte' };
  }

  await User.findByIdAndUpdate(userId, { $set: { referredBy: referrer._id } });

  const reward = settings?.referral?.refereeReward ?? 50;
  return {
    ok: true,
    message: `Code lag gaya! Pehli ride poori hote hi ₹${reward} aapke wallet mein aayenge.`,
  };
};

/**
 * Ride complete hone par call hota hai. Agar yeh us user ki pehli completed
 * ride hai aur usne koi code lagaya tha, to dono ko reward do.
 *
 * Ride completion kabhi fail nahi honi chahiye sirf isliye ki reward nahi de
 * paaye — isliye caller ise catch ke saath bulata hai aur yahan bhi try/catch hai.
 */
const rewardReferralIfFirstRide = async (userId) => {
  try {
    const settings = await getSettings();
    const conf = settings?.referral || {};
    if (conf.enabled === false) return;

    const user = await User.findById(userId).select('referredBy referralRewarded');
    if (!user?.referredBy || user.referralRewarded) return;

    const referrerReward = conf.referrerReward ?? 50;
    const refereeReward  = conf.refereeReward  ?? 50;

    // Flag pehle set karo, aur sirf tab jab wo abhi tak false ho. Do rides ek
    // saath complete hon to bhi reward ek hi baar milega.
    const claimed = await User.findOneAndUpdate(
      { _id: userId, referralRewarded: false },
      { $set: { referralRewarded: true } },
      { new: true },
    );
    if (!claimed) return;

    const [newUser, referrer] = await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { wallet: refereeReward } }, { new: true }).select('wallet'),
      User.findByIdAndUpdate(user.referredBy, { $inc: { wallet: referrerReward } }, { new: true }).select('wallet'),
    ]);

    await Transaction.create([
      {
        user:         userId,
        type:         'credit',
        category:     'referral_bonus',
        amount:       refereeReward,
        description:  'Referral bonus — pehli ride poori hui',
        status:       'completed',
        balanceAfter: newUser?.wallet,
      },
      {
        user:         user.referredBy,
        type:         'credit',
        category:     'referral_bonus',
        amount:       referrerReward,
        description:  'Referral bonus — aapke dost ne pehli ride ki',
        status:       'completed',
        balanceAfter: referrer?.wallet,
      },
    ]);
  } catch (err) {
    console.error('Referral reward error:', err.message);
  }
};

/** User ka code + kitne log laaye + kitna kamaya. */
const getReferralSummary = async (userId) => {
  const code = await ensureReferralCode(userId);
  const settings = await getSettings();

  const [totalReferred, rewardedCount, earnedAgg] = await Promise.all([
    User.countDocuments({ referredBy: userId }),
    User.countDocuments({ referredBy: userId, referralRewarded: true }),
    Transaction.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(String(userId)), category: 'referral_bonus' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    code,
    enabled:        settings?.referral?.enabled !== false,
    referrerReward: settings?.referral?.referrerReward ?? 50,
    refereeReward:  settings?.referral?.refereeReward ?? 50,
    totalReferred,
    // Jinhone abhi tak pehli ride nahi ki — inhi pe reward pending hai.
    pending:        Math.max(0, totalReferred - rewardedCount),
    totalEarned:    earnedAgg?.[0]?.total || 0,
  };
};

module.exports = {
  ensureReferralCode,
  applyReferralCode,
  rewardReferralIfFirstRide,
  getReferralSummary,
};
