// utils/fareQuote.js
// ─────────────────────────────────────────────────────────────────────────────
// Fare screen par jo dikha, booking par wahi lage.
//
// "Long pickup" charge is baat par tika hai ki sabse paas wala driver kitna
// door hai — aur drivers chalte rehte hain. Fare screen kholne aur Book dabane
// ke beech ke 20 second mein driver ek km aage-peeche ho jaaye to kiraya badal
// jaata, aur customer ko dikha kuch aur lagta kuch aur.
//
// Isliye fare screen par jo doori maani gayi wo 10 minute ke liye yaad rakhi
// jaati hai, aur booking usi se banti hai. Yaad na mile (10 minute nikal gaye,
// ya Redis band) to booking us waqt ki asli doori se banti hai.
// ─────────────────────────────────────────────────────────────────────────────
const redis = require('../config/redis');

const TTL_SEC = 10 * 60;

const r4 = (n) => Number(n).toFixed(4);

const quoteKey = (userId, pLat, pLng, dLat, dLng) =>
  `farequote:${userId}:${r4(pLat)},${r4(pLng)}:${r4(dLat)},${r4(dLng)}`;

/** Ek gaadi + category + AC ki chaabi. */
const optionKey = (vehicleType, variant = '', ac = false) =>
  `${vehicleType}|${variant || ''}|${ac ? 1 : 0}`;

const saveQuote = async (userId, coords, pickupKmByOption) => {
  try {
    await redis.setex(quoteKey(userId, ...coords), TTL_SEC, JSON.stringify(pickupKmByOption));
  } catch {
    // Yaad na rahe to booking us waqt ki doori se ban jaayegi.
  }
};

/** @returns {Promise<number|null>} yaad rakhi hui doori (km), ya null */
const readQuotedPickupKm = async (userId, coords, vehicleType, variant, ac) => {
  try {
    const raw = await redis.get(quoteKey(userId, ...coords));
    if (!raw) return null;
    const km = JSON.parse(raw)[optionKey(vehicleType, variant, ac)];
    return Number.isFinite(Number(km)) ? Number(km) : null;
  } catch {
    return null;
  }
};

module.exports = { saveQuote, readQuotedPickupKm, optionKey };
