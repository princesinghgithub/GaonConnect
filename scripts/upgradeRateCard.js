// Purane rate card mein jo field hain hi nahi, unhe bharo.
//
// Kya hua tha: rate card ka naya dhaancha (minimum fare mein kuch km shaamil,
// gaadi-wise waiting, long pickup, night %, cancel charge, pricing type) code
// mein aa gaya, par wo sirf NAYE database par lagta hai. Jo database pehle se
// chal raha hai usme ye field kabhi pahunche hi nahi. Isliye abhi:
//   • "minimum fare mein 2 km shaamil" lagta hi nahi — pehle km se paisa judta hai
//   • waiting, long pickup, raat ka charge gaadi ke hisaab se nahi lagte
//
// Yeh script SIRF GAYAB field bharti hai. Jo rate aapne dashboard se rakhe
// hain (minimum fare, per km...) unhe chhuti nahi.
//
// Chalane ka tareeka:
//   node scripts/upgradeRateCard.js            ← sirf dikhata hai
//   node scripts/upgradeRateCard.js --apply    ← sach mein bharta hai
//
// ⚠️  `includedKm` bharne se kiraya BADALTA hai: minimum fare mein pehle 2-3 km
// shaamil ho jaate hain, to har ride utni sasti ho jaati hai. Dry-run 10 km ka
// "pehle / baad" dikhata hai — dekh kar hi --apply lagaiye, aur chahein to
// baad mein dashboard ke Rate Card se rate theek kar lein.

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
// Server jaisa: .env.local (apna computer) pehle — wahan test database
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') });
dotenv.config();

const Setting = require('../models/Setting');
const { DEFAULT_VEHICLE_RATES } = require('../models/Setting');
const { getFareBreakdown, pricingTypeOf } = require('../utils/fareCalculator');

const APPLY = process.argv.includes('--apply');

// Jo field gayab ho to default se bharni hai. minimumFare / perKmRate isme
// jaan-bujhkar nahi — wo admin ke apne rate hain.
const FILL = [
  'includedKm', 'freeWaitingMinutes', 'waitingPerMinute', 'waitingPerHour',
  'freePickupKm', 'longPickupPerKm', 'nightChargePercent', 'cancellationFee',
  'fuelType', 'label', 'icon',
];

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) { console.error('MONGO_URI set nahi hai — .env dekho'); process.exit(1); }
  await mongoose.connect(uri);
  // Kis database par chal raha hai — galti se live par na chale
  console.log(`📦 Database: ${mongoose.connection.name}`);

  console.log(APPLY ? '\n*** APPLY MODE ***\n' : '\n(dry-run) kuch nahi badlega. Bharne ke liye --apply lagao.\n');

  const settings = await Setting.findOne();
  if (!settings) { console.log('Koi Setting document nahi mila.'); await mongoose.disconnect(); return; }

  // "Pehle" ki haalat KACHCHE data se — bilkul waise jaise server padhta hai
  // (`.lean()`). Mongoose se padhne par gayab field apne aap schema ke default
  // se bhare hue dikhte hain, aur lagta hai sab theek hai jabki database mein
  // wo field hain hi nahi.
  const before = await Setting.findOne().lean();
  const day    = new Date(2026, 0, 1, 12); // din ka waqt — raat ka charge beech mein na aaye
  const fareOf = (plain, id) => getFareBreakdown(10, id, { settings: plain, bookingDate: day }).totalFare;

  let changed = 0;
  for (const [id, def] of Object.entries(DEFAULT_VEHICLE_RATES)) {
    const cur = settings.vehicleRates.get(id);
    if (!cur) continue; // jo gaadi database mein hai hi nahi use yahan nahi jodte

    const plain = cur.toObject ? cur.toObject() : { ...cur };
    const raw   = before.vehicleRates?.[id] || {};
    const added = [];

    for (const key of FILL) {
      if (raw[key] === undefined || raw[key] === null || raw[key] === '') {
        if (def[key] !== undefined) { plain[key] = def[key]; added.push(`${key}=${def[key]}`); }
      }
    }
    // pricingType: khaali ya galti se 'distance' ho to sahi wala.
    const pricing = pricingTypeOf(id, raw, before.hourlyRates);
    if (raw.pricingType !== pricing) { plain.pricingType = pricing; added.push(`pricingType=${pricing}`); }

    if (!added.length) continue;
    changed += 1;
    console.log(`${id}:`);
    console.log(`   bharega → ${added.join(', ')}`);
    settings.vehicleRates.set(id, plain);
  }

  if (!changed) {
    console.log('Sab field pehle se bhare hain — kuch karne ki zaroorat nahi.');
    await mongoose.disconnect();
    return;
  }

  // 10 km ka kiraya: pehle aur baad
  const after = settings.toObject({ flattenMaps: true });
  console.log('\n10 km ka kiraya (din mein):');
  console.log('Gaadi'.padEnd(12), 'Pehle'.padStart(8), 'Baad'.padStart(8));
  for (const id of Object.keys(after.vehicleRates || {})) {
    if (pricingTypeOf(id, after.vehicleRates[id], after.hourlyRates) !== 'distance') continue;
    console.log(id.padEnd(12), `₹${fareOf(before, id)}`.padStart(8), `₹${fareOf(after, id)}`.padStart(8));
  }

  if (APPLY) {
    settings.markModified('vehicleRates');
    await settings.save();
    // Server settings 5 minute cache karta hai — turant lage isliye cache saaf.
    try {
      const { invalidateSettingsCache } = require('../utils/dynamicFare');
      await invalidateSettingsCache();
    } catch { /* cache apne aap 5 minute mein nayi ho jaayegi */ }
    console.log(`\nHo gaya — ${changed} gaadiyon ke gayab field bhar diye.\n`);
  } else {
    console.log('\n(dry-run) kuch nahi badla.\n');
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
