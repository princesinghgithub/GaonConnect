// utils/walletOps.js
// ─────────────────────────────────────────────────────────────────────────────
// Driver ke wallet mein paisa jodna / ghatana — ledger entry ke saath.
// Hisaab utils/settlement.js mein hai; yahan sirf database ka kaam.
// ─────────────────────────────────────────────────────────────────────────────
const Provider    = require('../models/Provider');
const Ride        = require('../models/Ride');
const Transaction = require('../models/Transaction');

/**
 * Wallet badlo aur ledger mein likho. `amount` plus ho to credit, minus to debit.
 * Atomic $inc — do request ek saath aayein to bhi balance nahi bigadta.
 */
const adjustProviderWallet = async ({ providerId, rideId, amount, category, description, earning = 0 }) => {
  if (!providerId || !amount) return null;

  const updated = await Provider.findByIdAndUpdate(
    providerId,
    {
      $inc: {
        'wallet.balance': amount,
        ...(earning ? { 'stats.totalEarnings': earning, 'stats.todayEarnings': earning } : {}),
      },
    },
    { new: true },
  ).select('wallet');

  await Transaction.create({
    provider:     providerId,
    ride:         rideId,
    type:         amount > 0 ? 'credit' : 'debit',
    category,
    amount:       Math.abs(amount),
    description,
    status:       'completed',
    balanceAfter: updated?.wallet?.balance,
  });

  return updated;
};

/**
 * Cash ride ka paisa baad mein platform ke paas aa gaya (driver ne QR dikhaya,
 * customer ne UPI se bhara). Ride complete hote waqt maana gaya tha ki paisa
 * driver ke haath mein hai — ab wo platform ke paas hai, to driver ko dena hai.
 *
 * `walletSettled: 'cash' → 'platform'` ka badlav atomic hai, isliye webhook
 * dobara aaye (Razorpay retry karta hai) to paisa do baar nahi judta.
 */
const creditPlatformCollection = async (rideId) => {
  const ride = await Ride.findOneAndUpdate(
    { _id: rideId, walletSettled: 'cash' },
    { $set: { walletSettled: 'platform' } },
    { new: true },
  );
  if (!ride || !ride.provider) return null;

  const amount = Number(ride.finalFare || ride.fare) || 0;
  return adjustProviderWallet({
    providerId:  ride.provider,
    rideId:      ride._id,
    amount,
    category:    'ride_payment',
    description: `Customer ne ₹${amount} QR/UPI se bhare — aapke wallet mein`,
  });
};

module.exports = { adjustProviderWallet, creditPlatformCollection };
