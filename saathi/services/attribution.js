const User            = require('../../models/User');
const Provider        = require('../../models/Provider');
const Saathi          = require('../models/Saathi');
const SaathiReferral  = require('../models/SaathiReferral');
const { normalizeCode } = require('../utils/code');

// Referral ko record karna. Driver/User app signup ke turant baad
// POST /api/saathi/claim call karti hai — isliye purane auth controllers ko
// chhedna nahi padta aur dono apps apne hisaab se ye call add kar sakti hain.

/**
 * @param {object} opts
 * @param {string} opts.code   - Saathi ka referral code (MAU001)
 * @param {string} opts.phone  - Jis bande ne signup kiya uska 10-digit phone
 * @param {'driver'|'customer'} opts.type
 * @returns {Promise<{ok: boolean, status: string, message: string}>}
 *
 * Kabhi throw nahi karta — caller ek signup flow hai, use yahan se girana nahi.
 */
const claimReferral = async ({ code, phone, type }) => {
  const cleanCode  = normalizeCode(code);
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

  if (!cleanCode)  return { ok: false, status: 'invalid_code',  message: 'Referral code khaali hai.' };
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { ok: false, status: 'invalid_phone', message: 'Valid 10-digit phone number chahiye.' };
  }
  if (!['driver', 'customer'].includes(type)) {
    return { ok: false, status: 'invalid_type', message: "type 'driver' ya 'customer' hona chahiye." };
  }

  const saathi = await Saathi.findOne({ saathiCode: cleanCode });
  if (!saathi) return { ok: false, status: 'invalid_code', message: 'Ye referral code kisi Saathi ka nahi hai.' };
  if (saathi.status !== 'active' || saathi.isBlocked) {
    return { ok: false, status: 'saathi_inactive', message: 'Ye Saathi account abhi active nahi hai.' };
  }

  const user = await User.findOne({ phone: cleanPhone });
  if (!user) {
    return { ok: false, status: 'user_not_found', message: 'Is number se koi account nahi mila. Pehle signup karein.' };
  }

  // Apna hi code apne aap par nahi laga sakte
  if (saathi.phone === cleanPhone) {
    return { ok: false, status: 'self_referral', message: 'Apna hi referral code apne account par nahi laga sakte.' };
  }

  const provider = type === 'driver' ? await Provider.findOne({ user: user._id }) : null;
  if (type === 'driver' && !provider) {
    return { ok: false, status: 'driver_not_found', message: 'Is number se driver profile nahi mili.' };
  }

  // Driver KYC pehle hi ho chuki ho to referral seedha 'verified' se shuru ho
  const status = type === 'driver' && provider?.isApproved ? 'verified' : 'joined';

  try {
    await SaathiReferral.create({
      saathi:   saathi._id,
      type,
      user:     user._id,
      provider: provider?._id || null,
      code:     cleanCode,
      status,
      village:  user.city || saathi.village || '',
    });

    return { ok: true, status: 'claimed', message: `Referral ${saathi.name} ke account se jud gaya.` };
  } catch (error) {
    // Unique index (type + user) — ye banda pehle se kisi ka referral hai.
    // Pehle aane wale Saathi ka haq rehta hai, isliye ye error nahi hai.
    if (error.code === 11000) {
      const existing = await SaathiReferral.findOne({ type, user: user._id });
      const same = existing && String(existing.saathi) === String(saathi._id);
      return {
        ok: same,
        status: same ? 'already_claimed' : 'claimed_by_other',
        message: same
          ? 'Ye referral pehle se aapke account mein hai.'
          : 'Ye banda pehle se kisi aur Saathi ke referral mein hai.',
      };
    }
    throw error;
  }
};

module.exports = { claimReferral };
