// Crash-safety helpers. Saathi module ka poora maqsad ye hai ki isme kuch bhi
// toote to baaki GaonConnect API chalti rahe — isliye har async handler yahin
// se wrap hota hai aur koi error kabhi global process tak nahi pahunchta.

/**
 * Async route handler ko wrap karo. Iske bina ek bhi `await` fail hone par
 * Express use pakad nahi paata aur wo unhandledRejection ban jaata hai —
 * jahan server.js poora process exit kar deta hai.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Background kaam (cron, notification, attribution) ke liye. Kabhi throw nahi
 * karta — sirf log karke aage badh jaata hai, kyunki in cheezon ka fail hona
 * user ki request ya server ko nahi girana chahiye.
 */
const runSafely = async (label, fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error(`[saathi] ${label} fail hua:`, error.message);
    return null;
  }
};

module.exports = { asyncHandler, runSafely };
