// utils/incentive.js
// Rapido-style daily targets — "aaj 10 rides pure karo, ₹150 bonus".
// Yahi cheez driver ko peak hours mein online rakhti hai; sirf per-ride kamai
// pe wo dopahar mein ghar chala jaata hai.
//
// Tiers Setting.incentive.daily se aate hain, isliye admin bina deploy ke
// badal sakta hai. Bonus tab milta hai jab driver kisi tier ki ride-count
// chhoo leta hai; ek din mein ek hi baar, aur upar wale tier pe pahunche to
// pehle diye gaye bonus ka farak hi milta hai.
const Provider    = require('../models/Provider');
const Ride        = require('../models/Ride');
const Transaction = require('../models/Transaction');
const { getSettings } = require('./dynamicFare');

// Din IST se naapa jaata hai — server UTC pe chalta hai, aur bina is shift ke
// "aaj" raat 5:30 baje badalta, jo driver ke liye bilkul galat hai.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const istDayRange = (now = new Date()) => {
  const ist   = new Date(now.getTime() + IST_OFFSET_MS);
  const start = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  const startUtc = new Date(start.getTime() - IST_OFFSET_MS);
  return {
    start: startUtc,
    end:   new Date(startUtc.getTime() + 24 * 60 * 60 * 1000),
    // Label IST ki tareekh hai, startUtc ki nahi — startUtc IST aadhi raat hai
    // jo UTC mein pichhle din 18:30 padta hai, to usse date lene par driver ko
    // ek din peeche ki tareekh dikhti.
    key:   ist.toISOString().slice(0, 10),
  };
};

/** Aaj ke tiers, sorted (kam rides pehle). */
const sortedTiers = (settings) =>
  [...(settings?.incentive?.daily || [])]
    .filter((t) => t && t.rides > 0 && t.bonus > 0)
    .sort((a, b) => a.rides - b.rides);

/**
 * Driver ka aaj ka incentive status — app mein progress bar dikhane ke liye.
 */
const getDriverIncentiveStatus = async (providerId) => {
  const settings = await getSettings();
  const tiers    = sortedTiers(settings);
  const enabled  = settings?.incentive?.enabled === true;

  const { start, end, key } = istDayRange();

  const completedToday = await Ride.countDocuments({
    provider:    providerId,
    status:      'completed',
    completedAt: { $gte: start, $lt: end },
  });

  const earnedAgg = await Transaction.aggregate([
    {
      $match: {
        provider: require('mongoose').Types.ObjectId.createFromHexString(String(providerId)),
        category: 'incentive',
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const earnedToday = earnedAgg?.[0]?.total || 0;
  const nextTier    = tiers.find((t) => t.rides > completedToday) || null;

  return {
    enabled,
    date:        key,
    tiers,
    ridesToday:  completedToday,
    earnedToday,
    nextTier,
    ridesToNext: nextTier ? nextTier.rides - completedToday : 0,
  };
};

/**
 * Ride complete hone par bulao. Agar aaj koi naya tier pura hua hai to farak
 * ka bonus driver ke wallet mein daal do.
 */
const creditDriverIncentive = async (providerId) => {
  try {
    const settings = await getSettings();
    if (settings?.incentive?.enabled !== true) return;

    const tiers = sortedTiers(settings);
    if (!tiers.length) return;

    const { start, end } = istDayRange();

    const completedToday = await Ride.countDocuments({
      provider:    providerId,
      status:      'completed',
      completedAt: { $gte: start, $lt: end },
    });

    // Sabse ooncha tier jo aaj pura ho chuka hai.
    const achieved = [...tiers].reverse().find((t) => completedToday >= t.rides);
    if (!achieved) return;

    // Aaj ab tak kitna incentive de chuke hain — sirf farak dena hai, warna
    // 5-ride tier ke baad 10-ride tier pe pahunchne par dono ka poora bonus
    // mil jaata (dohra kharcha).
    const paidAgg = await Transaction.aggregate([
      {
        $match: {
          provider: require('mongoose').Types.ObjectId.createFromHexString(String(providerId)),
          category: 'incentive',
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const alreadyPaid = paidAgg?.[0]?.total || 0;
    const owed        = achieved.bonus - alreadyPaid;
    if (owed <= 0) return;

    const updated = await Provider.findByIdAndUpdate(
      providerId,
      { $inc: { 'wallet.balance': owed, 'stats.totalEarnings': owed } },
      { new: true },
    ).select('wallet');

    await Transaction.create({
      provider:     providerId,
      type:         'credit',
      category:     'incentive',
      amount:       owed,
      description:  `Daily target bonus — ${achieved.rides} rides`,
      status:       'completed',
      balanceAfter: updated?.wallet?.balance,
    });
  } catch (err) {
    console.error('Incentive credit error:', err.message);
  }
};

module.exports = { getDriverIncentiveStatus, creditDriverIncentive, istDayRange };
