// Saathi module ka ekmatra entry point.
//
// server.js sirf itna karta hai:
//   require('./saathi').mount(app);
//
// Agar is module mein kuch bhi toota ho — syntax error, missing model, kharab
// config — to mount() false lautata hai aur GaonConnect ki baaki API bilkul
// waise hi chalti rehti hai. Saathi ka kaam karte waqt main app girne ka dar
// nahi hona chahiye.

const BASE_PATH = '/api/saathi';

let enabled = false;

/**
 * Saathi routes aur cron job ko app par chadhao.
 * @param {import('express').Express} app
 * @returns {boolean} true agar module chalu ho gaya
 */
const mount = (app) => {
  if (process.env.SAATHI_MODULE_ENABLED === 'false') {
    console.log('[saathi] Module band hai (SAATHI_MODULE_ENABLED=false)');
    return false;
  }

  try {
    const routes = require('./routes');
    app.use(BASE_PATH, routes);

    const { startSaathiRewardJob } = require('./jobs/rewardJob');
    startSaathiRewardJob();

    enabled = true;
    console.log(`[saathi] Module chalu — ${BASE_PATH}`);
    return true;
  } catch (error) {
    // Yahi wo safety net hai jiski wajah se Saathi ka koi bhi error main API
    // ko nahi rok sakta. Loud log isliye taaki chup-chaap band na pada rahe.
    console.error('[saathi] ⚠️  Module load nahi hua — baaki API normal chalegi.');
    console.error('[saathi] Reason:', error.stack || error.message);

    // Module dead hai to uske routes ko 503 dena chahiye, silent 404 nahi —
    // warna portal ko lagta hai ki URL galat hai.
    app.use(BASE_PATH, (_req, res) => res.status(503).json({
      success: false,
      message: 'Saathi service abhi available nahi hai.',
    }));

    return false;
  }
};

const isEnabled = () => enabled;

module.exports = { mount, isEnabled, BASE_PATH };
