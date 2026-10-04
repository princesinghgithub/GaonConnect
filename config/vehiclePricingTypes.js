// ─────────────────────────────────────────────────────────────────────────────
// Kaunsi gaadi per-km nahi chalti.
//
// Rate card (Setting.vehicleRates) mein har gaadi ka `pricingType` hota hai,
// par purane database mein ye field hai hi nahi — wahan tractor, JCB aur
// wedding car bhi "distance" maani jaati thi. Nateeja: customer tractor chunta
// to app use sawaari ki tarah per-km wali screen par bhej deti aur drop maangti,
// jabki tractor khet par ghante ke hisaab se kaam karta hai.
//
// Ye list us galti ko rokti hai: rate card mein pricingType na ho (ya galti se
// 'distance' ho) tab bhi in gaadiyon ka sahi tareeka yahin se milta hai.
// Admin ki banayi nayi gaadi, jiske kaam ke rate (hourlyRates) bhare hain, wo
// apne aap 'hourly' maani jaati hai — dekho fareCalculator.pricingTypeOf.
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  tractor:   'hourly',
  jcb:       'hourly',
  thresher:  'hourly',
  harvester: 'per_acre',
  wedding:   'package',
};
