// Upkaran/attachment ka config maujooda database mein daalta hai.
//
// Kyun zaroori: models/Setting.js mein `equipment` ka default sirf tab lagta
// hai jab Setting ka document PEHLI baar banta hai. Jo database pehle se chal
// raha hai usme wo default kabhi nahi pahunchta — yaani app booking wizard ke
// upkaran wale kadam par khaali suchi dikhati rahegi.
//
// Chalane ka tareeka:
//   node scripts/syncEquipmentConfig.js --dry-run   (sirf batata hai)
//   node scripts/syncEquipmentConfig.js             (likh deta hai)
//
// DHYAN DO: yeh config/equipmentDefaults.js ki poori copy chipka deta hai.
// Agar admin ne dashboard se equipment badla ho, wo badlav mit jaayega. Isliye
// pehle --dry-run chalao aur dekho ki abhi database mein kya hai.
//
// Dobara chalane se kuch nahi bigadta.

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const Setting  = require('../models/Setting');
const DEFAULTS = require('../config/equipmentDefaults');

// Server jaisa: .env.local (apna computer) pehle — wahan test database
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') });
dotenv.config();

const DRY = process.argv.includes('--dry-run');

const count = (conf) =>
  Object.entries(conf || {})
    .map(([k, v]) => `${k}: ${v.equipment?.length || 0} upkaran, ${v.variants?.length || 0} variant`)
    .join(' | ') || '(khaali)';

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

  console.log('abhi database mein :', count(settings.equipment));
  console.log('code mein           :', count(DEFAULTS));

  if (DRY) {
    console.log('(dry-run) kuch likha nahi gaya');
  } else {
    settings.equipment = DEFAULTS;
    settings.markModified('equipment');
    await settings.save();
    console.log('Ho gaya — config database mein likh diya gaya');
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
