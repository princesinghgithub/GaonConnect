// Driver wallet ki jaanch — SIRF PADHTA HAI, kuch nahi likhta.
//
// Kyun: pehle har ride poori hone par driver ke wallet mein poori kamai jud
// jaati thi, chahe ride cash ki ho. Cash ride mein paisa driver ke haath mein
// pehle hi aa chuka hota hai — to wallet mein juda hua wahi paisa "do baar"
// ho gaya, aur driver use withdraw bhi kar sakta tha.
//
// Naya code ye galti nahi karta (dekho utils/settlement.js), par jo paisa
// PEHLE se wallets mein galat jud chuka hai wo apne aap theek nahi hota. Yeh
// script batati hai ki kis driver ke wallet mein kitna aisa paisa hai, taaki
// withdrawal manzoor karne se pehle aap dekh sakein.
//
// Chalane ka tareeka:
//   node scripts/walletAudit.js
//
// "Cash se juda" = un rides ki wallet credit jinka paisa driver ne cash mein
// liya (paymentMethod cash aur QR/online se bhara nahi gaya).
// "Asli baaki" = wallet − cash se juda. Minus aaye to driver pehle hi zyada
// nikaal chuka hai.

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
// Server jaisa: .env.local (apna computer) pehle — wahan test database
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') });
dotenv.config();

const Provider    = require('../models/Provider');
const Transaction = require('../models/Transaction');
require('../models/Ride');
require('../models/User');

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI set nahi hai — .env dekho');
    process.exit(1);
  }
  await mongoose.connect(uri);
  // Kis database par chal raha hai — galti se live par na chale
  console.log(`📦 Database: ${mongoose.connection.name}`);

  const providers = await Provider.find({ 'wallet.balance': { $ne: 0 } })
    .select('wallet user')
    .populate('user', 'name phone')
    .lean();

  // Ride ki wajah se wallet mein aaye credit, ride ke saath.
  const credits = await Transaction.find({
    provider: { $in: providers.map((p) => p._id) },
    type:     'credit',
    ride:     { $ne: null },
    // Cancel ka charge aur tip asli credit hain — sirf ride ki kamai dekhni hai.
    category: { $nin: ['cancellation_fee', 'tip', 'incentive', 'referral_bonus'] },
  })
    .select('provider amount ride')
    .populate('ride', 'paymentMethod paymentStatus walletSettled')
    .lean();

  const cashCredited = new Map();
  for (const t of credits) {
    const r = t.ride;
    if (!r) continue;
    // Naye code ki likhi entry sahi hai: cash ride par wo poori kamai nahi,
    // sirf promo/commission ka farak jodta hai. `walletSettled` naye code ka nishaan hai.
    if (r.walletSettled) continue;
    const collectedByDriver = r.paymentMethod !== 'online' && r.paymentStatus !== 'paid';
    if (!collectedByDriver) continue;
    const k = String(t.provider);
    cashCredited.set(k, (cashCredited.get(k) || 0) + (t.amount || 0));
  }

  const rows = providers
    .map((p) => {
      const balance = p.wallet?.balance || 0;
      const cash    = cashCredited.get(String(p._id)) || 0;
      return { name: p.user?.name || '—', phone: p.user?.phone || '', balance, cash, real: balance - cash };
    })
    .sort((a, b) => b.cash - a.cash);

  console.log(`\n${rows.length} drivers ke wallet mein balance hai\n`);
  console.log('Driver'.padEnd(24), 'Wallet'.padStart(10), 'Cash se juda'.padStart(14), 'Asli baaki'.padStart(12));
  console.log('-'.repeat(62));
  for (const r of rows) {
    console.log(
      String(r.name).slice(0, 22).padEnd(24),
      `₹${Math.round(r.balance)}`.padStart(10),
      `₹${Math.round(r.cash)}`.padStart(14),
      `₹${Math.round(r.real)}`.padStart(12),
    );
  }

  const sum = (k) => Math.round(rows.reduce((s, r) => s + r[k], 0));
  console.log('-'.repeat(62));
  console.log('Kul'.padEnd(24), `₹${sum('balance')}`.padStart(10), `₹${sum('cash')}`.padStart(14), `₹${sum('real')}`.padStart(12));
  console.log('\n"Cash se juda" wala paisa driver pehle hi customer se le chuka hai.');
  console.log('Yeh script kuch badalti nahi — sirf dikhati hai.\n');

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
