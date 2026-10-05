// utils/dues.js
// ─────────────────────────────────────────────────────────────────────────────
// Customer par pichhla baaki — aur uski wasooli.
//
// Do tarah ka baaki ho sakta hai:
//   1. Cancel ka charge jo us waqt wallet mein paisa na hone se kat nahi paaya
//      (Transaction: user, debit, cancellation_fee, status 'pending')
//   2. Online payment wali ride jo poori ho gayi par customer ne bhari nahi
//
// Pehle in dono ka koi ilaaj nahi tha: charge "pending" pada rehta tha aur
// kabhi wasool nahi hota tha. Driver ko ya to paisa milta hi nahi tha, ya
// platform apni jeb se deta — dono galat.
//
// Ab tareeka ye hai:
//   • Baaki customer ki AGLI ride ke kiraye mein ek alag line ban kar judta hai
//     ("Pichhla baaki ₹20"). Fare screen par pehle dikhta hai — chhupa charge nahi.
//   • Wo ride poori hote hi baaki "bhara hua" ho jaata hai, aur jis driver ka
//     nuksan hua tha (cancel wala) uske wallet mein usi waqt paisa jaata hai.
//   • Platform kisi ko apni jeb se kuch nahi deta — isliye driver aur customer
//     mil kar bhi isse paisa nahi bana sakte.
// ─────────────────────────────────────────────────────────────────────────────
const Ride        = require('../models/Ride');
const Transaction = require('../models/Transaction');
const { adjustProviderWallet } = require('./walletOps');

// Jo ride abhi chal rahi hai ya aane wali hai.
const OPEN_STATUSES = ['scheduled', 'searching', 'accepted', 'arrived', 'started', 'working'];

/**
 * Customer par abhi kitna baaki hai.
 * Jo baaki kisi chalti/aane wali ride mein pehle hi jud chuka hai wo dobara
 * nahi ginte — warna ek hi ₹20 do rides mein lag jaata.
 */
const getCustomerDues = async (userId) => {
  const empty = { total: 0, cancellation: 0, rides: 0, txnIds: [], rideIds: [] };
  if (!userId) return empty;

  const [pendingTxns, unpaidRides, carrying] = await Promise.all([
    Transaction.find({ user: userId, type: 'debit', category: 'cancellation_fee', status: 'pending' })
      .select('amount').lean(),
    Ride.find({ customer: userId, status: 'completed', paymentMethod: 'online', paymentStatus: { $ne: 'paid' } })
      .select('fare finalFare').lean(),
    Ride.find({ customer: userId, status: { $in: OPEN_STATUSES }, 'dues.amount': { $gt: 0 } })
      .select('dues').lean(),
  ]);

  const taken = new Set();
  carrying.forEach((r) => {
    (r.dues?.txnIds  || []).forEach((id) => taken.add(String(id)));
    (r.dues?.rideIds || []).forEach((id) => taken.add(String(id)));
  });

  const txns  = pendingTxns.filter((t) => !taken.has(String(t._id)));
  const rides = unpaidRides.filter((r) => !taken.has(String(r._id)));

  const cancellation = txns.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const rideDue      = rides.reduce((s, r) => s + (Number(r.finalFare || r.fare) || 0), 0);

  return {
    total:        Math.round(cancellation + rideDue),
    cancellation: Math.round(cancellation),
    rides:        Math.round(rideDue),
    txnIds:       txns.map((t) => t._id),
    rideIds:      rides.map((r) => r._id),
  };
};

/**
 * Jis ride mein baaki juda tha wo poori ho gayi — baaki ab bhara hua hai.
 * Har cheez ek hi baar hoti hai (status ke filter se), dobara call par kuch nahi.
 */
const settleCustomerDues = async (ride) => {
  const dues = ride?.dues;
  if (!dues || !(dues.amount > 0)) return;

  for (const txnId of dues.txnIds || []) {
    const txn = await Transaction.findOneAndUpdate(
      { _id: txnId, status: 'pending' },
      { $set: { status: 'completed', processedAt: new Date(), description: 'Ride cancel karne ka charge (agli ride mein bhara)' } },
      { new: true },
    );
    // Jis driver ka waqt aur petrol gaya tha, uska paisa ab aaya hai.
    if (txn?.payoutProvider) {
      await adjustProviderWallet({
        providerId:  txn.payoutProvider,
        rideId:      txn.ride,
        amount:      txn.amount,
        category:    'cancellation_fee',
        description: 'Customer ne pichhla cancel charge bhar diya — aapka hissa',
        earning:     txn.amount,
      }).catch((err) => console.error('dues payout error:', err.message));
    }
  }

  if ((dues.rideIds || []).length) {
    await Ride.updateMany(
      { _id: { $in: dues.rideIds }, paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'paid' } },
    );
  }
};

/** Kya ye ride kisi chalti ride ke baaki mein judi hui hai? (do baar bharne se bachao) */
const isRideCarriedAsDue = async (rideId, customerId) => {
  const carrier = await Ride.findOne({
    customer: customerId,
    status: { $in: OPEN_STATUSES },
    'dues.rideIds': rideId,
  }).select('_id').lean();
  return !!carrier;
};

module.exports = { getCustomerDues, settleCustomerDues, isRideCarriedAsDue };
