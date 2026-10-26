// utils/nominatim.js
// ─────────────────────────────────────────────────────────────────────────────
// Public Nominatim (nominatim.openstreetmap.org) ki usage policy strict hai:
// zyada se zyada 1 request/second, aur violate karne wale ka IP block kar diya
// jaata hai. Ban server ke IP pe lagta hai — matlab ek saath POORE app ki
// location search band ho jaati hai, sirf ek user ki nahi.
//
// Pehle har search seedha Nominatim ko jaati thi: koi cache nahi, koi throttle
// nahi. Search 500ms debounce pe hai, toh ek user ek address type kare toh 2-4
// requests — 20-30 log ek saath search karein aur limit cross.
//
// Yeh module do cheezein karta hai:
//   1. Redis cache — same query dobara Nominatim tak jaati hi nahi
//   2. Global outbound throttle — cache miss hone par bhi do requests ke beech
//      kam se kam MIN_GAP_MS ka gap, chahe kitne bhi users ek saath search karein
// ─────────────────────────────────────────────────────────────────────────────
const axios = require('axios');
const redis = require('../config/redis');

const BASE_URL = 'https://nominatim.openstreetmap.org';

// Policy 1/sec kehti hai; thoda margin rakhte hain clock drift ke liye.
const MIN_GAP_MS = 1100;

// Queue mein itna intezaar hone laga toh fail-fast karo. User ko 15 second
// spinner dikhane se behtar hai turant "dobara try karo" bolna.
const MAX_QUEUE_WAIT_MS = 5000;

// Search results: jagahein roz nahi badalti, par naye POI add hote rehte hain.
const SEARCH_TTL_SEC  = 24 * 60 * 60;      // 1 din
// Coordinates → address practically kabhi nahi badalta.
const REVERSE_TTL_SEC = 30 * 24 * 60 * 60; // 30 din

// ─── Global outbound throttle ────────────────────────────────────────────────
// `chain` ek promise chain hai jispe har outbound call lagti hai, isliye do
// calls kabhi overlap nahi karti aur beech mein hamesha MIN_GAP_MS ka gap hota
// hai. `queued` sirf isliye track karte hain taaki wait lamba hone par turant
// reject kar sakein, chain mein lagne se pehle.
let chain     = Promise.resolve();
let queued    = 0;
let lastCall  = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const throttled = (fn) => {
  // Chain mein lagne se pehle andaza lagao ki kitna wait karna padega.
  if (queued * MIN_GAP_MS > MAX_QUEUE_WAIT_MS) {
    const err = new Error('nominatim_busy');
    err.code = 'NOMINATIM_BUSY';
    return Promise.reject(err);
  }

  queued += 1;
  const result = chain.then(async () => {
    const gap = Date.now() - lastCall;
    if (gap < MIN_GAP_MS) await sleep(MIN_GAP_MS - gap);
    lastCall = Date.now();
    return fn();
  });

  // Chain ko kabhi tootne mat do — ek call fail hone par baaki queue ruk jaati.
  chain = result.then(() => {}, () => {});
  return result.finally(() => { queued -= 1; });
};

// ─── Redis helpers (cache down ho toh request fail nahi honi chahiye) ────────
const cacheGet = async (key) => {
  try {
    const hit = await redis.get(key);
    return hit ? JSON.parse(hit) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (key, value, ttl) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // Cache likhna fail hua — koi baat nahi, sirf agli baar cache miss hoga.
  }
};

// ─── Core request ────────────────────────────────────────────────────────────
const request = (path, params) =>
  throttled(() =>
    axios.get(`${BASE_URL}${path}`, {
      params,
      timeout: 10000,
      headers: {
        // Nominatim policy: har client ko apne aap ko identify karna zaroori hai.
        'User-Agent': 'GaonConnect/1.0 (gaonconnect.in@gmail.com)',
      },
    }).then((r) => r.data)
  );

// ─── Public API ──────────────────────────────────────────────────────────────

// Free-text search. Cache key normalized query hai taaki "Rewa", "rewa" aur
// " REWA " sab ek hi entry share karein.
const search = async (query, limit = 5) => {
  const norm = String(query).trim().toLowerCase().replace(/\s+/g, ' ');
  const key  = `osm:search:${limit}:${norm}`;

  const cached = await cacheGet(key);
  if (cached) return cached;

  const data = await request('/search', {
    q:              norm,
    format:         'json',
    countrycodes:   'in',
    limit,
    addressdetails: 1,
  });

  await cacheSet(key, data, SEARCH_TTL_SEC);
  return data;
};

const lookup = async (osmIds) => {
  const key    = `osm:lookup:${osmIds}`;
  const cached = await cacheGet(key);
  if (cached) return cached;

  const data = await request('/lookup', { osm_ids: osmIds, format: 'json' });
  await cacheSet(key, data, REVERSE_TTL_SEC);
  return data;
};

// Reverse geocode. Coordinates ko ~11m grid pe round karte hain (5 decimal
// places) — warna GPS ka har halka sa jitter naya cache key banata aur cache
// kabhi hit hi nahi hota.
const reverse = async (lat, lon) => {
  const rLat = Number(lat).toFixed(5);
  const rLon = Number(lon).toFixed(5);
  const key  = `osm:reverse:${rLat}:${rLon}`;

  const cached = await cacheGet(key);
  if (cached) return cached;

  const data = await request('/reverse', { lat: rLat, lon: rLon, format: 'json' });
  await cacheSet(key, data, REVERSE_TTL_SEC);
  return data;
};

module.exports = { search, lookup, reverse };
