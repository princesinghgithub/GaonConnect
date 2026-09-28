const mongoose = require('mongoose');

const Ride     = require('../../models/Ride');
const Provider = require('../../models/Provider');
const User     = require('../../models/User');

const Saathi         = require('../models/Saathi');
const SaathiReferral = require('../models/SaathiReferral');
const SaathiEarning  = require('../models/SaathiEarning');
const SaathiWithdrawal = require('../models/SaathiWithdrawal');
const incentives     = require('../config/incentives');

// Reward engine.
//
// Ye jaan-bujhkar "pull" model hai: rideController ya bookingController mein
// koi hook nahi lagaya gaya. Cron periodically completed rides dhoondta hai
// aur pending rewards bana deta hai.
//
// Faayda: ride flow ka code bilkul nahi chhua gaya, isliye Saathi module mein
// koi bhi bug ride complete hone ko nahi tod sakta. Nuksan: reward turant nahi,
// kuch minute baad banta hai — incentive ke liye ye bilkul theek hai.

const REASONS = {
  driver_activation:      'Driver first completed booking',
  customer_first_booking: 'Customer first completed booking',
};

/** Referred bande ki sabse pehli completed ride dhoondo */
const findFirstCompletedRide = async (referral) => {
  const filter = referral.type === 'driver'
    ? { provider: referral.provider, status: 'completed' }
    : { customer: referral.user,     status: 'completed' };

  return Ride.findOne(filter).sort({ createdAt: 1 }).select('_id createdAt');
};

/** Display ke liye naam — table mein "Reference" column yahi dikhata hai */
const displayName = async (referral) => {
  const user = await User.findById(referral.user).select('name');
  return user?.name || 'Unknown';
};

/**
 * Ek referral ko process karo. Agar pehli ride complete ho chuki hai to
 * pending earning bana do aur referral ko 'activated' mark kar do.
 * Return: true agar naya reward bana.
 */
const processReferral = async (referral) => {
  if (referral.rewarded) return false;

  const ride = await findFirstCompletedRide(referral);
  if (!ride) return false;

  const type   = referral.type === 'driver' ? 'driver_activation' : 'customer_first_booking';
  const amount = referral.type === 'driver'
    ? incentives.DRIVER_ACTIVATION
    : incentives.CUSTOMER_FIRST_BOOKING;

  try {
    await SaathiEarning.create({
      saathi:    referral.saathi,
      type,
      amount,
      status:    'pending',
      referral:  referral._id,
      ride:      ride._id,
      reason:    REASONS[type],
      reference: await displayName(referral),
    });
  } catch (error) {
    // Unique index ne dobara banne se rok diya — reward pehle se hai.
    // Referral flag neeche phir bhi set ho jaayega, taaki agli baar skip ho.
    if (error.code !== 11000) throw error;
  }

  referral.status      = 'activated';
  referral.rewarded    = true;
  referral.firstRide   = ride._id;
  referral.firstRideAt = ride.createdAt;
  await referral.save();

  return true;
};

/** Driver KYC status ko referral par sync karo (activated ko haath mat lagao) */
const syncPendingDriverStatuses = async () => {
  const pending = await SaathiReferral.find({
    type:   'driver',
    status: { $in: ['joined', 'verified'] },
  }).select('provider status').limit(500);

  let changed = 0;
  for (const referral of pending) {
    if (!referral.provider) continue;
    const provider = await Provider.findById(referral.provider).select('isApproved isRejected');
    if (!provider) continue;

    const next = provider.isRejected ? 'rejected' : provider.isApproved ? 'verified' : 'joined';
    if (next !== referral.status) {
      referral.status = next;
      await referral.save();
      changed += 1;
    }
  }
  return changed;
};

/** Milestone bonus — X activations pure hone par ek baar */
const processMilestones = async (saathiId) => {
  const activations = await SaathiReferral.countDocuments({ saathi: saathiId, status: 'activated' });

  let created = 0;
  for (const milestone of incentives.MILESTONES) {
    if (activations < milestone.activations) continue;
    if (milestone.amount <= 0) continue;

    // Milestone par `referral` null hota hai, isliye unique index kaam nahi
    // karta — yahan explicit check hi guard hai.
    const already = await SaathiEarning.exists({
      saathi:    saathiId,
      type:      'milestone_bonus',
      reference: String(milestone.activations),
    });
    if (already) continue;

    await SaathiEarning.create({
      saathi:    saathiId,
      type:      'milestone_bonus',
      amount:    milestone.amount,
      status:    'pending',
      reason:    milestone.label,
      reference: String(milestone.activations),
    });
    created += 1;
  }
  return created;
};

/**
 * Poora sweep — cron isi ko bulata hai.
 * Har referral apne try/catch mein hai: ek kharab row poore run ko nahi rokti.
 */
const runRewardSweep = async ({ limit = 500 } = {}) => {
  const summary = { scanned: 0, rewarded: 0, milestones: 0, statusSynced: 0, errors: 0 };

  summary.statusSynced = await syncPendingDriverStatuses().catch(() => 0);

  const pending = await SaathiReferral.find({ rewarded: false, status: { $ne: 'rejected' } })
    .sort({ createdAt: 1 })
    .limit(limit);

  const touched = new Set();

  for (const referral of pending) {
    summary.scanned += 1;
    try {
      if (await processReferral(referral)) {
        summary.rewarded += 1;
        touched.add(String(referral.saathi));
      }
    } catch (error) {
      summary.errors += 1;
      console.error(`[saathi] referral ${referral._id} reward fail:`, error.message);
    }
  }

  for (const saathiId of touched) {
    try {
      summary.milestones += await processMilestones(saathiId);
    } catch (error) {
      summary.errors += 1;
      console.error(`[saathi] milestone ${saathiId} fail:`, error.message);
    }
  }

  return summary;
};

/**
 * Ek Saathi ka balance. Kahin store nahi hota — hamesha ledger se banta hai.
 *
 *   available = approved earnings (credit) − withdrawals (debit)
 *
 * Isiliye "wallet aur history match nahi kar rahe" wali bug ho hi nahi sakti,
 * aur kisi earning row ko lock ya split karne ki zarurat nahi padti.
 */
const getBalance = async (saathiId) => {
  const objectId = new mongoose.Types.ObjectId(String(saathiId));

  const [earningRows, withdrawalRows] = await Promise.all([
    SaathiEarning.aggregate([
      { $match: { saathi: objectId } },
      { $group: { _id: '$status', total: { $sum: '$amount' } } },
    ]),
    SaathiWithdrawal.aggregate([
      { $match: { saathi: objectId, status: { $ne: 'rejected' } } },
      { $group: { _id: '$status', total: { $sum: '$amount' } } },
    ]),
  ]);

  const earnings    = Object.fromEntries(earningRows.map((r) => [r._id, r.total]));
  const withdrawals = Object.fromEntries(withdrawalRows.map((r) => [r._id, r.total]));

  const approved = earnings.approved || 0;
  const pending  = earnings.pending  || 0;

  const paid = withdrawals.paid || 0;
  // pending + approved withdrawals — paisa abhi gaya nahi, par uspe dawa ho chuki
  const locked = (withdrawals.pending || 0) + (withdrawals.approved || 0);

  return {
    approved,
    pending,
    paid,
    locked,
    available: Math.max(0, approved - paid - locked),
    lifetime:  approved,
  };
};

module.exports = {
  runRewardSweep,
  processReferral,
  processMilestones,
  syncPendingDriverStatuses,
  getBalance,
};
