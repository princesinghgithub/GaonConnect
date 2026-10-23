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

const DAY_MS = 24 * 60 * 60 * 1000;

// Lazy — Provider/Ride/notifications is file se pehle load hote hain kai jagah
const Provider = () => require('../models/Provider');
const Ride     = () => require('../models/Ride');

const driverConf = (settings) => {
  const r = settings?.referral || {};
  return {
    enabled:        r.enabled !== false,
    referrerReward: r.driverReferrerReward ?? 50,
    refereeReward:  r.driverRefereeReward ?? 50,
    ridesTarget:    Math.max(1, r.driverRidesTarget ?? 10),
    windowDays:     Math.max(1, r.driverWindowDays ?? 30),
  };
};

/**
 * Referral ka paisa sahi wallet mein — jo driver hai uska Provider wallet
 * (driver app mein wahi dikhta hai), warna customer ka User.wallet. Pehle
 * driver ne kisi customer ko laaya to bonus customer wallet mein jaata tha
 * jo driver app mein kahin dikhta hi nahi tha.
 */
const creditReferralBonus = async (userId, amount, description) => {
  if (!userId || !(amount > 0)) return null;
  const provider = await Provider().findOne({ user: userId }).select('_id deviceInfo');
  if (provider) {
    const updated = await Provider().findByIdAndUpdate(
      provider._id,
      { $inc: { 'wallet.balance': amount } },
      { new: true },
    ).select('wallet');
    await Transaction.create({
      provider:     provider._id,
      type:         'credit',
      category:     'referral_bonus',
      amount,
      description,
      status:       'completed',
      balanceAfter: updated?.wallet?.balance,
    });
    return { fcmToken: provider.deviceInfo?.fcmToken };
  }
  const user = await User.findByIdAndUpdate(userId, { $inc: { wallet: amount } }, { new: true }).select('wallet fcmToken');
  await Transaction.create({
    user:         userId,
    type:         'credit',
    category:     'referral_bonus',
    amount,
    description,
    status:       'completed',
    balanceAfter: user?.wallet,
  });
  return { fcmToken: user?.fcmToken };
};

const pushBonus = (target, title, body) => {
  if (!target?.fcmToken) return;
  const { notify } = require('./notifications');
  notify.custom(target.fcmToken, { title, body, data: { type: 'REFERRAL_BONUS' } }).catch(() => {});
};

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

    // Naye customer ka bonus hamesha uske customer wallet mein (agli ride mein
    // kaam aaye); laane wala driver ho to uske driver wallet mein.
    const newUser = await User.findByIdAndUpdate(userId, { $inc: { wallet: refereeReward } }, { new: true }).select('wallet');
    await Transaction.create({
      user:         userId,
      type:         'credit',
      category:     'referral_bonus',
      amount:       refereeReward,
      description:  'Referral bonus — pehli ride poori hui',
      status:       'completed',
      balanceAfter: newUser?.wallet,
    });
    const referrer = await creditReferralBonus(user.referredBy, referrerReward, 'Referral bonus — aapke dost ne pehli ride ki');
    pushBonus(referrer, `🎉 ₹${referrerReward} referral bonus`, 'Aapke laaye hue customer ne pehli ride poori ki.');
  } catch (err) {
    console.error('Referral reward error:', err.message);
  }
};

/**
 * Naye driver par kisi ka code — registration par, ya baad mein driver app se
 * jab tak usne koi ride poori na ki ho aur window ke din baaki hon.
 */
const applyDriverReferralCode = async (userId, rawCode) => {
  const settings = await getSettings();
  const conf = driverConf(settings);
  if (!conf.enabled) return { ok: false, message: 'Referral abhi band hai' };

  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, message: 'Referral code daalein' };

  const provider = await Provider().findOne({ user: userId }).select('referral createdAt');
  if (!provider) return { ok: false, message: 'Driver profile nahi mila' };
  if (provider.referral?.referredBy) return { ok: false, message: 'Aap pehle hi ek referral code laga chuke hain' };

  if (Date.now() - new Date(provider.createdAt).getTime() > conf.windowDays * DAY_MS) {
    return { ok: false, message: `Code sirf join karne ke ${conf.windowDays} din ke andar lag sakta hai` };
  }
  const done = await Ride().countDocuments({ provider: provider._id, status: 'completed' });
  if (done > 0) return { ok: false, message: 'Pehli ride ke baad code nahi lag sakta' };

  const referrer = await User.findOne({ referralCode: code }).select('_id');
  if (!referrer) return { ok: false, message: 'Yeh code sahi nahi hai' };
  if (String(referrer._id) === String(userId)) return { ok: false, message: 'Apna hi code nahi laga sakte' };

  // Sirf tab jab abhi tak koi code nahi laga — do request ek saath aayein to bhi ek hi
  const set = await Provider().findOneAndUpdate(
    { _id: provider._id, 'referral.referredBy': { $exists: false } },
    { $set: { 'referral.referredBy': referrer._id, 'referral.appliedAt': new Date(), 'referral.rewarded': false } },
  );
  if (!set) return { ok: false, message: 'Aap pehle hi ek referral code laga chuke hain' };

  return {
    ok: true,
    message: conf.refereeReward > 0
      ? `Code lag gaya! ${conf.windowDays} din mein ${conf.ridesTarget} rides poori karo, ₹${conf.refereeReward} bonus milega.`
      : 'Code lag gaya!',
  };
};

/**
 * Driver ki ride complete hone par. Agar wo kisi ke code se aaya tha aur
 * window ke andar target rides poori ho gayin to dono ko bonus — ek hi baar.
 */
const rewardDriverReferral = async (providerId) => {
  try {
    const settings = await getSettings();
    const conf = driverConf(settings);
    if (!conf.enabled) return;

    const provider = await Provider().findById(providerId).select('referral createdAt deviceInfo');
    if (!provider?.referral?.referredBy || provider.referral.rewarded) return;

    const deadline = new Date(new Date(provider.createdAt).getTime() + conf.windowDays * DAY_MS);
    if (Date.now() > deadline.getTime()) return;

    const done = await Ride().countDocuments({ provider: providerId, status: 'completed', completedAt: { $lte: deadline } });
    if (done < conf.ridesTarget) return;

    const claimed = await Provider().findOneAndUpdate(
      { _id: providerId, 'referral.rewarded': { $ne: true } },
      { $set: { 'referral.rewarded': true, 'referral.rewardedAt': new Date() } },
    );
    if (!claimed) return;

    if (conf.refereeReward > 0) {
      const updated = await Provider().findByIdAndUpdate(
        providerId,
        { $inc: { 'wallet.balance': conf.refereeReward } },
        { new: true },
      ).select('wallet');
      await Transaction.create({
        provider:     providerId,
        type:         'credit',
        category:     'referral_bonus',
        amount:       conf.refereeReward,
        description:  `Joining bonus — ${conf.ridesTarget} rides poori`,
        status:       'completed',
        balanceAfter: updated?.wallet?.balance,
      });
      pushBonus({ fcmToken: provider.deviceInfo?.fcmToken }, `🎉 ₹${conf.refereeReward} joining bonus`, `${conf.ridesTarget} rides poori hui — bonus wallet mein aa gaya.`);
    }

    const referrer = await creditReferralBonus(
      provider.referral.referredBy, conf.referrerReward,
      `Referral bonus — aapke laaye driver ne ${conf.ridesTarget} rides poori ki`,
    );
    pushBonus(referrer, `🎉 ₹${conf.referrerReward} referral bonus`, `Aapke laaye hue driver ne ${conf.ridesTarget} rides poori ki.`);
  } catch (err) {
    console.error('Driver referral reward error:', err.message);
  }
};

// "Ramesh K." + "XXXXXX3210" — doosre ka poora naam/number nahi dikhate
const maskName = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'GaonConnect user';
  return parts.length > 1 ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0];
};
const maskPhone = (phone) => {
  const p = String(phone || '').replace(/\D/g, '');
  return p.length >= 4 ? `XXXXXX${p.slice(-4)}` : '';
};

/** Driver app ki Refer & Earn screen — code, inaam, laaye hue log, apna joining bonus. */
const getDriverReferralSummary = async (userId) => {
  const code = await ensureReferralCode(userId);
  const settings = await getSettings();
  const conf = driverConf(settings);
  const customerReferrerReward = settings?.referral?.referrerReward ?? 50;
  const customerRefereeReward  = settings?.referral?.refereeReward ?? 50;

  const me = await Provider().findOne({ user: userId }).select('_id referral createdAt');
  const mongoose = require('mongoose');
  const uid = mongoose.Types.ObjectId.createFromHexString(String(userId));

  const [drivers, customers, earnedAgg] = await Promise.all([
    Provider().find({ 'referral.referredBy': userId })
      .select('user referral createdAt')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    User.find({ referredBy: userId })
      .select('name phone referralRewarded createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Transaction.aggregate([
      { $match: { category: 'referral_bonus', $or: [{ user: uid }, ...(me ? [{ provider: me._id }] : [])] } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const progressFor = async (p) => {
    const deadline = new Date(new Date(p.createdAt).getTime() + conf.windowDays * DAY_MS);
    const done = await Ride().countDocuments({ provider: p._id, status: 'completed', completedAt: { $lte: deadline } });
    const status = p.referral?.rewarded ? 'completed' : Date.now() > deadline.getTime() ? 'expired' : 'pending';
    return { done: Math.min(done, conf.ridesTarget), target: conf.ridesTarget, deadline, status };
  };

  const driverRows = await Promise.all(drivers.map(async (p) => ({
    type:     'driver',
    name:     maskName(p.user?.name),
    phone:    maskPhone(p.user?.phone),
    joinedAt: p.createdAt,
    reward:   conf.referrerReward,
    ...(await progressFor(p)),
  })));

  const customerRows = customers.map((c) => ({
    type:     'customer',
    name:     maskName(c.name),
    phone:    maskPhone(c.phone),
    joinedAt: c.createdAt,
    reward:   customerReferrerReward,
    done:     c.referralRewarded ? 1 : 0,
    target:   1,
    status:   c.referralRewarded ? 'completed' : 'pending',
  }));

  const referrals = [...driverRows, ...customerRows]
    .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

  // Ye driver khud kisi ke code se aaya tha — uska apna joining bonus
  const myBonus = me?.referral?.referredBy
    ? { reward: conf.refereeReward, ...(await progressFor(me)) }
    : null;

  const canApplyCode = Boolean(me && !me.referral?.referredBy && conf.enabled &&
    Date.now() - new Date(me.createdAt).getTime() <= conf.windowDays * DAY_MS &&
    (await Ride().countDocuments({ provider: me._id, status: 'completed' })) === 0);

  return {
    code,
    enabled: conf.enabled,
    driver: {
      referrerReward: conf.referrerReward,
      refereeReward:  conf.refereeReward,
      ridesTarget:    conf.ridesTarget,
      windowDays:     conf.windowDays,
      appUrl:         settings?.appUpdate?.driver?.storeUrl || 'https://play.google.com/store/apps/details?id=com.gaonconnect.driver',
    },
    customer: {
      referrerReward: customerReferrerReward,
      refereeReward:  customerRefereeReward,
      appUrl:         settings?.appUpdate?.customer?.storeUrl || 'https://play.google.com/store/apps/details?id=com.gaonconnect.user',
    },
    stats: {
      totalReferred: referrals.length,
      completed:     referrals.filter((r) => r.status === 'completed').length,
      pending:       referrals.filter((r) => r.status === 'pending').length,
      totalEarned:   earnedAgg?.[0]?.total || 0,
    },
    referrals,
    myBonus,
    canApplyCode,
  };
};

/** User ka code + kitne log laaye + kitna kamaya. */
const getReferralSummary = async (userId) => {
  const code = await ensureReferralCode(userId);
  const settings = await getSettings();

  const [totalReferred, rewardedCount, earnedAgg, customers] = await Promise.all([
    User.countDocuments({ referredBy: userId }),
    User.countDocuments({ referredBy: userId, referralRewarded: true }),
    Transaction.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(String(userId)), category: 'referral_bonus' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // User app ki list — naam/number chhupa kar (maskName/maskPhone)
    User.find({ referredBy: userId })
      .select('name phone referralRewarded createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const referrerReward = settings?.referral?.referrerReward ?? 50;

  return {
    code,
    enabled:        settings?.referral?.enabled !== false,
    referrerReward,
    refereeReward:  settings?.referral?.refereeReward ?? 50,
    appUrl:         settings?.appUpdate?.customer?.storeUrl || 'https://play.google.com/store/apps/details?id=com.gaonconnect.user',
    totalReferred,
    // Jinhone abhi tak pehli ride nahi ki — inhi pe reward pending hai.
    pending:        Math.max(0, totalReferred - rewardedCount),
    rewarded:       rewardedCount,
    totalEarned:    earnedAgg?.[0]?.total || 0,
    referrals: customers.map((c) => ({
      name:     maskName(c.name),
      phone:    maskPhone(c.phone),
      joinedAt: c.createdAt,
      reward:   referrerReward,
      status:   c.referralRewarded ? 'completed' : 'pending',
    })),
  };
};

/** User app ki "Mere Inaam" — customer wallet mein aaye saare referral bonus. */
const getCustomerRewards = async (userId) => {
  const mongoose = require('mongoose');
  const uid = mongoose.Types.ObjectId.createFromHexString(String(userId));
  const match = { user: uid, type: 'credit', status: 'completed', category: 'referral_bonus' };
  const IST = 5.5 * 60 * 60 * 1000;
  const ist = new Date(Date.now() + IST);
  const monthStart = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST);

  const [items, agg] = await Promise.all([
    Transaction.find(match).select('category amount description createdAt').sort({ createdAt: -1 }).limit(100).lean(),
    Transaction.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        total: { $sum: '$amount' },
        thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, '$amount', 0] } },
      } },
    ]),
  ]);

  return {
    totalEarned: agg?.[0]?.total || 0,
    thisMonth:   agg?.[0]?.thisMonth || 0,
    items,
  };
};

module.exports = {
  ensureReferralCode,
  applyReferralCode,
  rewardReferralIfFirstRide,
  getReferralSummary,
  applyDriverReferralCode,
  rewardDriverReferral,
  getDriverReferralSummary,
  getCustomerRewards,
};
