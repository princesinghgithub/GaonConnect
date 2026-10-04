// Saari services chalu database mein pahunchao — jo gaayab hai wahi jodo.
//
// Kyun zaroori: models/Setting.js ke default (vehicleRates, hourlyRates) sirf
// tab lagte hain jab Setting ka document PEHLI baar banta hai. Chalu database
// mein baad mein jodi gayi cheezein kabhi nahi pahunchti:
//   • gaadiyan — thresher, harvester, goods, e-rickshaw, ambulance, wedding
//     ka rate card hi na ho to customer app mein dikhengi hi nahi
//   • kaam — thresher/harvester ke kaam, aur auzaar wale naye kaam
//     (cultivator, bhusa, baler, khet samtal, gaddha, JCB breaker/drill)
//
// syncEquipmentConfig.js ki tarah poora config nahi chipkata: sirf jo gaadi,
// category ya kaam GAAYAB hai wahi jodta hai. Admin ne jo rate, naam ya
// chalu/band badla hai wo waisa hi rehta hai. Naye kaam rate 0 aur band aate
// hain — admin dashboard (Rate Card) se apne ilaake ka rate bharega aur chalu
// karega, tab customer ko dikhenge.
//
// Chalane ka tareeka:
//   node scripts/addToolServices.js --dry-run   (sirf batata hai)
//   node scripts/addToolServices.js             (likh deta hai)
//
// Dobara chalane se kuch nahi bigadta.

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const Setting  = require('../models/Setting');
const HOURLY_DEFAULTS = require('../config/hourlyRatesDefaults');

// Server jaisa: .env.local (apna computer) pehle — wahan test database
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') });
dotenv.config();

const DRY = process.argv.includes('--dry-run');
const plain = (x) => (x && typeof x.toObject === 'function' ? x.toObject() : x);

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI set nahi hai — .env dekho');
    process.exit(1);
  }

  await mongoose.connect(uri);
  // Kis database par chal raha hai — galti se live par na chale
  console.log(`📦 Database: ${mongoose.connection.name}`);
  console.log('DB se jud gaye');

  const settings = await Setting.findOne();
  if (!settings) {
    console.log('Koi Setting document nahi mila — app pehli baar chalne par khud ban jaayega');
    await mongoose.disconnect();
    return;
  }

  const added = [];

  // ── 1. Gaadi ke rate card (vehicleRates) ─────────────────────────────────
  // Naya (khaali) Setting banakar uske default padhte hain — models/Setting.js
  // mein likhe default hi asli source hain, yahan dobara nahi likhe.
  const fresh = new Setting();
  for (const [id, rate] of fresh.vehicleRates.entries()) {
    if (!settings.vehicleRates.has(id)) {
      if (!DRY) settings.vehicleRates.set(id, plain(rate));
      added.push(`gaadi → "${rate.label || id}" ka rate card`);
    }
  }

  // ── 2. Kaam (hourlyRates) ────────────────────────────────────────────────
  for (const vehicleType of Object.keys(HOURLY_DEFAULTS)) {
    const current = (settings.hourlyRates.get(vehicleType) || []).map(plain);
    let changed = false;
    for (const defCat of HOURLY_DEFAULTS[vehicleType] || []) {
      const cat = current.find((c) => c.id === defCat.id);
      if (!cat) {
        current.push(defCat);
        changed = true;
        added.push(`${vehicleType} → nayi category "${defCat.label}" (${defCat.sub.length} kaam)`);
        continue;
      }
      for (const sub of defCat.sub) {
        if (!(cat.sub || []).some((s) => s.id === sub.id)) {
          cat.sub = [...(cat.sub || []), sub];
          changed = true;
          added.push(`${vehicleType} → ${cat.label} → "${sub.label}"`);
        }
      }
    }
    if (changed && !DRY) settings.hourlyRates.set(vehicleType, current);
  }

  if (!added.length) {
    console.log('Sab kuch pehle se maujood hai — kuch jodna nahi pada');
  } else {
    console.log('Jode jaane wale:');
    added.forEach((a) => console.log('  +', a));
  }

  if (DRY) {
    console.log('(dry-run) kuch likha nahi gaya');
  } else if (added.length) {
    settings.markModified('vehicleRates');
    settings.markModified('hourlyRates');
    await settings.save();
    console.log('Ho gaya — ab admin dashboard (Rate Card) se naye kaamon ka rate bharein aur chalu karein.');
    console.log('Note: settings Redis mein 5 minute cache hoti hain — badlav thodi der mein dikhega.');
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
