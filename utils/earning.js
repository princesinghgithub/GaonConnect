// utils/earning.js
// Ek poori hui ride se driver ki kamai — earnings screens / reports isi se.
//
// `fare` driver ki kamai nahi hai: usme customer ka pichhla baaki juda ho
// sakta hai (driver ka nahi) aur promo kata hua hota hai (jo platform bharta
// hai), aur commission bhi nahi ghata hota. Ride complete hote waqt asli
// hisaab `driverEarning` mein jam jaata hai (dekho utils/settlement.js).
//
// `walletSettled` usi waqt likha jaata hai — wo khaali ho to ride us hisaab ke
// aane se pehle ki hai, tab `fare` hi sabse achha andaaza hai.
exports.rideEarning = (ride) => {
  if (!ride) return 0;
  if (ride.walletSettled) return Number(ride.driverEarning) || 0;
  return Number(ride.fare) || 0;
};

/** Earnings queries mein kaunse fields chahiye. */
exports.EARNING_FIELDS = 'fare driverEarning walletSettled completedAt';
