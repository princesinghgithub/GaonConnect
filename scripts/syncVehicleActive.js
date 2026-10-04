// Kaunsi gaadi customer ko dikhe aur kaunsi nahi — maujooda database mein.
//
// Kyun zaroori: models/Setting.js mein jo `isActive` likha hai wo SIRF tab
// lagta hai jab Setting ka document PEHLI baar banta hai. Jo database pehle
// se chal raha hai usme wo kabhi nahi pahunchta — yaani code mein service band
// kar dene par bhi customer ko wo dikhti rehti hai.
//
// Aur ek baat: vehicle types admin dashboard se runtime par bhi jud sakte hain
// (dekho Setting.vehicleRates ka comment — wo Map hai, fixed keys nahi). Isliye
// aapke database mein aisi id ho sakti hai jo code ke defaults mein hai hi
// nahi — jaise 'truck'. Us wajah se yeh script id KHUD lene deti hai; sirf
// code ke defaults par bharosa karna kaafi nahi hai.
//
// Chalane ka tareeka:
//   node scripts/syncVehicleActive.js --list
//       database mein kaunsi gaadi hai aur uska haal kya hai — sirf batata hai
//
//   node scripts/syncVehicleActive.js --off bike,truck,ambulance
//       inhe band karo
//
//   node scripts/syncVehicleActive.js --on bike
//       wapas chalu karo
//
//   node scripts/syncVehicleActive.js
//       code ke defaults se sync karo (jo models/Setting.js mein likha hai)
//
// Har command ke saath `--dry-run` laga sakte hain — tab kuch likha nahi
// jaata, sirf dikhta hai ki kya badalta. Dobara chalane se kuch nahi bigadta.
//
// Yeh script SIRF `isActive` chhuti hai. Rate, minimum fare, commission —
// kuch nahi badalta, taaki admin ne dashboard se jo daam set kiye hon wo
// safe rahein.

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const Setting  = require('../models/Setting');
const { DEFAULT_VEHICLE_RATES } = require('../models/Setting');

// Server jaisa: .env.local (apna computer) pehle — wahan test database
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') });
dotenv.config();

const args = process.argv.slice(2);
const DRY  = args.includes('--dry-run');
const LIST = args.includes('--list');

/** `--off a,b,c` se ids nikalo. */
const idsFor = (flag) => {
  const i = args.indexOf(flag);
  if (i === -1) return null;
  const raw = args[i + 1];
  if (!raw || raw.startsWith('--')) {
    console.error(`${flag} ke baad ids do — jaise: ${flag} bike,truck`);
    process.exit(1);
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const OFF = idsFor('--off');
const ON  = idsFor('--on');

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI set nahi hai — .env dekho');
    process.exit(1);
  }

  await mongoose.connect(uri);
  // Kis database par chal raha hai — galti se live par na chale
  console.log(`📦 Database: ${mongoose.connection.name}`);
  console.log('DB se jud gaye\n');

  const settings = await Setting.findOne();
  if (!settings) {
    console.log('Koi Setting document nahi mila — app pehli baar chalne par khud sahi ban jaayega');
    await mongoose.disconnect();
    return;
  }

  const rates = settings.vehicleRates;
  const get = (id) => (rates?.get ? rates.get(id) : rates?.[id]);
  const allIds = rates?.keys ? [...rates.keys()] : Object.keys(rates || {});

  // ─── --list: pehle dekho database mein hai kya ────────────────────────────
  if (LIST) {
    console.log('Database mein maujood vehicle types:\n');
    for (const id of allIds) {
      const v = get(id);
      const on = v?.isActive !== false;
      console.log(`  ${on ? '●' : '○'} ${id.padEnd(14)} ${on ? 'chalu' : 'band '}  ${v?.label || ''}`);
    }
    console.log('\n● = customer ko dikhti hai   ○ = band hai');
    await mongoose.disconnect();
    return;
  }

  // ─── Kya-kya badalna hai ──────────────────────────────────────────────────
  /** id -> chahiye chalu (true) ya band (false) */
  const want = new Map();

  if (OFF || ON) {
    (OFF || []).forEach((id) => want.set(id, false));
    (ON  || []).forEach((id) => want.set(id, true));
  } else {
    // Koi id nahi di — code ke defaults se sync karo
    for (const [id, def] of Object.entries(DEFAULT_VEHICLE_RATES)) {
      want.set(id, def.isActive !== false);
    }
  }

  const changes = [];
  const missing = [];

  for (const [id, target] of want) {
    const cur = get(id);
    if (!cur) { missing.push(id); continue; }

    const now = cur.isActive !== false;
    if (now === target) continue;

    changes.push({ id, from: now, to: target });
    if (!DRY) {
      const plain = cur.toObject ? cur.toObject() : { ...cur };
      if (rates.set) rates.set(id, { ...plain, isActive: target });
      else rates[id].isActive = target;
    }
  }

  if (missing.length) {
    console.log(`Database mein ye ids hain hi nahi (chhod diya): ${missing.join(', ')}`);
    console.log('`--list` chalakar dekhiye ki asli ids kya hain\n');
  }

  if (!changes.length) {
    console.log('Sab pehle se sahi hai — kuch nahi badla');
  } else {
    for (const c of changes) {
      console.log(`  ${c.id.padEnd(14)} ${c.from ? 'chalu' : 'band '}  ->  ${c.to ? 'chalu' : 'band'}`);
    }
    if (DRY) {
      console.log('\n(dry-run) kuch likha nahi gaya');
    } else {
      settings.markModified('vehicleRates');
      await settings.save();
      console.log(`\nHo gaya — ${changes.length} gaadi update hui`);
    }
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
