// config/fareAdjustmentTypes.js
// ─────────────────────────────────────────────────────────────────────────────
// Driver kis wajah se extra charge maang sakta hai (Rapido jaisa — toll,
// parking, kaam badhna). Id backend aur dono apps mein ek hi hain; label app
// apni bhasha mein dikhati hai, yahan wala sirf notification ke liye.
//
//   needsHours  — kitne ghante extra lage, wo bhi bhejna hai
//   needsReason — apne shabdon mein wajah likhna zaroori
//   timeBased   — ghante ke hisaab wale kaam par mana: wahan asli chala hua
//                 samay bill mein apne aap judta hai, extra maangna dohra
//                 charge hota.
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  extra_time: { label: 'Kaam mein zyada samay laga', needsHours: true, timeBased: true },
  extra_work: { label: 'Kaam badh gaya' },
  toll:       { label: 'Toll tax' },
  parking:    { label: 'Parking' },
  loading:    { label: 'Extra loading / unloading' },
  other:      { label: 'Anya', needsReason: true },
};
