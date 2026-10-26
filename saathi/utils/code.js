const crypto = require('crypto');
const Saathi = require('../models/Saathi');

// Referral code gaon ke naam se banta hai taaki Saathi ko yaad rahe aur phone
// par bolna aasaan ho: Mauganj ka pehla Saathi = MAU001.
//
// Confusing letters (I, O, 0, 1) hata diye gaye hain — ye code gaon mein zubani
// aur haath se likh kar share hota hai, jahan "0 ya O?" asli dikkat hai.
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const prefixFrom = (village = '', fallback = 'GCN') => {
  const letters = String(village).toUpperCase().replace(/[^A-Z]/g, '');
  return letters.length >= 3 ? letters.slice(0, 3) : fallback;
};

const randomSuffix = (len = 4) => {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i += 1) out += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
  return out;
};

/**
 * Us gaon ke liye agla free code nikalo: MAU001, MAU002...
 * Sequence bhar jaaye ya race lag jaaye to random suffix par chala jaata hai,
 * taaki registration kabhi "code nahi ban paaya" par atke nahi.
 */
const generateSaathiCode = async (village) => {
  const prefix = prefixFrom(village);

  for (let attempt = 1; attempt <= 99; attempt += 1) {
    const existing = await Saathi.countDocuments({ saathiCode: new RegExp(`^${prefix}\d+$`) });
    const candidate = `${prefix}${String(existing + attempt).padStart(3, '0')}`;
    if (!(await Saathi.exists({ saathiCode: candidate }))) return candidate;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${prefix}${randomSuffix(4)}`;
    if (!(await Saathi.exists({ saathiCode: candidate }))) return candidate;
  }

  throw new Error('Saathi code generate nahi ho paaya');
};

/** Display ID — support aur portal par yahi dikhta hai: GC-MAU-001 */
const buildSaathiId = (saathiCode) => {
  const match = String(saathiCode).match(/^([A-Z]+)(.+)$/);
  return match ? `GC-${match[1]}-${match[2]}` : `GC-${saathiCode}`;
};

/** User ne jo type/scan kiya use saaf karo — spaces, dashes, lowercase sab chalein */
const normalizeCode = (code) =>
  String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

module.exports = { generateSaathiCode, buildSaathiId, normalizeCode, prefixFrom };
