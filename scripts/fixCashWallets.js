// Cash rides ki wajah se wallets mein galat juda paisa theek karo.
//
// Kya hua tha: purana code har ride poori hone par driver ke wallet mein poori
// kamai jod deta tha — cash ride par bhi, jabki wo paisa driver customer se
// haath mein le chuka hota hai. Wallet ka wo balance asal mein kisi par baaki
// nahi hai, par withdraw ho sakta hai. (Sirf dekhna ho to: scripts/walletAudit.js)
//
// Yeh script har driver ke wallet se utna ghata deti hai jitna cash rides se
// galat juda tha, aur ledger mein uski ek saaf entry likhti hai.
//
// Chalane ka tareeka:
//   node scripts/fixCashWallets.js            ← sirf dikhata hai, kuch nahi badalta
//   node scripts/fixCashWallets.js --apply    ← sach mein theek karta hai
//
// Surakshit kyun hai:
//   • Bina --apply ke kuch likha nahi jaata.
//   • Wallet kabhi 0 se neeche nahi jaata — driver ne pehle hi kuch nikaal
//     liya ho to bacha hua hi ghatta hai (us par alag se baat karni hogi).
//   • Jin rides ka hisaab ho gaya un par nishaan (walletSettled: 'cash') lag
//     jaata hai, isliye dobara chalane par wahi paisa dobara nahi ghatta.
//   • Driver ki "total kamai" (stats) ko yeh chhuti nahi — wo sahi hai, driver
//     ne wo kamaya hi tha. Sirf wallet ka balance theek hota hai.
//
// Deploy ke BAAD chalao: purana code chalte hue chalaoge to nayi cash rides
// phir se wallet bharti rahengi.

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const Provider    = require('../models/Provider');
const Transaction = require('../models/Transaction');
const Ride        = require('../models/Ride');
require('../models/User');

const APPLY = process.argv.includes('--apply');

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI set nahi hai — .env dekho');
    process.exit(1);
  }
  await mongoose.connect(uri);

  console.log(APPLY
    ? '\n*** APPLY MODE — wallets badle jaayenge ***\n'
    : '\n(dry-run) kuch nahi badlega. Sach mein theek karne ke liye --apply lagao.\n');

  // Ride ki wajah se wallet mein aaye credit.
  const credits = await Transaction.find({
    provider: { $ne: null },
    type:     'credit',
    ride:     { $ne: null },
    category: { $nin: ['cancellation_fee', 'tip', 'incentive', 'referral_bonus', 'ride_payment'] },
  })
    .select('provider amount ride')
    .populate('ride', 'paymentMethod paymentStatus walletSettled')
    .lean();

  // provider → { amount, rideIds }
  const wrong = new Map();
  for (const t of credits) {
    const r = t.ride;
    if (!r || r.walletSettled) continue; // naye code ki entry, ya pehle theek ho chuki
    const collectedByDriver = r.paymentMethod !== 'online' && r.paymentStatus !== 'paid';
    if (!collectedByDriver) continue;

    const k = String(t.provider);
    const cur = wrong.get(k) || { amount: 0, rideIds: [] };
    cur.amount += t.amount || 0;
    cur.rideIds.push(r._id);
    wrong.set(k, cur);
  }

  if (!wrong.size) {
    console.log('Koi galat juda paisa nahi mila — sab theek hai.');
    await mongoose.disconnect();
    return;
  }

  const providers = await Provider.find({ _id: { $in: [...wrong.keys()] } })
    .select('wallet user')
    .populate('user', 'name')
    .lean();

  console.log('Driver'.padEnd(22), 'Wallet'.padStart(9), 'Galat juda'.padStart(12), 'Ghatega'.padStart(9), 'Naya'.padStart(9));
  console.log('-'.repeat(64));

  let totalCut = 0;
  let shortfall = 0;

  for (const p of providers) {
    const { amount, rideIds } = wrong.get(String(p._id));
    const balance = p.wallet?.balance || 0;
    // 0 se neeche nahi.
    const cut = Math.max(0, Math.min(amount, balance));
    totalCut += cut;
    shortfall += amount - cut;

    console.log(
      String(p.user?.name || '—').slice(0, 20).padEnd(22),
      `₹${Math.round(balance)}`.padStart(9),
      `₹${Math.round(amount)}`.padStart(12),
      `₹${Math.round(cut)}`.padStart(9),
      `₹${Math.round(balance - cut)}`.padStart(9),
    );

    if (!APPLY) continue;

    if (cut > 0) {
      // Filter mein balance ki shart — beech mein withdrawal ho gaya ho to
      // wallet minus mein na jaaye; tab yeh driver chhoot jaata hai aur
      // agli baar chalane par dobara dekha jaata hai.
      const updated = await Provider.findOneAndUpdate(
        { _id: p._id, 'wallet.balance': { $gte: cut } },
        { $inc: { 'wallet.balance': -cut } },
        { new: true },
      ).select('wallet');

      if (!updated) {
        console.log('   ↳ chhoda — is beech balance badal gaya. Dobara chalao.');
        continue;
      }

      await Transaction.create({
        provider:     p._id,
        type:         'debit',
        category:     'adjustment',
        amount:       cut,
        description:  `Hisaab theek kiya — ${rideIds.length} cash rides ka paisa aapne customer se seedha liya tha, wo galti se wallet mein bhi jud gaya tha`,
        status:       'completed',
        balanceAfter: updated.wallet?.balance,
      });
    }

    // In rides ka hisaab ho gaya — dobara na ginein.
    await Ride.updateMany(
      { _id: { $in: rideIds }, walletSettled: { $in: ['', null] } },
      { $set: { walletSettled: 'cash' } },
    );
  }

  console.log('-'.repeat(64));
  console.log(`Kul ghatega: ₹${Math.round(totalCut)}`);
  if (shortfall > 0) {
    console.log(`₹${Math.round(shortfall)} wallet mein bacha hi nahi (pehle nikaal liya gaya) — isse yeh script nahi chhuti.`);
  }
  console.log(APPLY ? '\nHo gaya.\n' : '\n(dry-run) kuch nahi badla.\n');

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
