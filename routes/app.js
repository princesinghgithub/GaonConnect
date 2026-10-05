// routes/app.js
// ─────────────────────────────────────────────────────────────────────────────
// Apps ke liye public config — abhi sirf "update chahiye ya nahi".
//
// GET /api/app/update?app=customer|driver
//   → { minVersion, latestVersion, storeUrl }
// App apna version khud milaati hai (minVersion se kam = zaroori update).
// Login se pehle bhi chahiye (purani app login screen par hi ruk jaaye),
// isliye bina token ke.
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { getSettings } = require('../utils/dynamicFare');

const DEFAULTS = {
  customer: { minVersion: '0.0.0', latestVersion: '', storeUrl: 'https://play.google.com/store/apps/details?id=com.gaonconnect.user' },
  driver:   { minVersion: '0.0.0', latestVersion: '', storeUrl: 'https://play.google.com/store/apps/details?id=com.gaonconnect.driver' },
};

router.get('/update', async (req, res) => {
  const app = req.query.app === 'driver' ? 'driver' : 'customer';
  try {
    const settings = await getSettings();
    const saved = settings?.appUpdate?.[app] || {};
    const d = DEFAULTS[app];
    return res.json({
      success: true,
      data: {
        minVersion:    saved.minVersion    || d.minVersion,
        latestVersion: saved.latestVersion || d.latestVersion,
        storeUrl:      saved.storeUrl      || d.storeUrl,
      },
    });
  } catch (err) {
    // Settings na mile to kisi ko roko mat — app chalti rahe
    return res.json({ success: true, data: DEFAULTS[app] });
  }
});

module.exports = router;
