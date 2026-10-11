// utils/routing.js
// ─────────────────────────────────────────────────────────────────────────────
// Sadak ke hisaab se doori aur raasta.
//
// Ab tak kiraya pickup se drop ki SEEDHI doori (haversine) par banta tha. Sadak
// kabhi seedhi nahi hoti — gaon mein to bilkul nahi: 14 km seedhi doori ka
// raasta aksar 19-20 km ka nikalta hai. Matlab driver 20 km chalata tha aur
// paisa 14 km ka milta tha. Aur map par raasta bhi ek seedhi lakeer thi jo
// kheton ke upar se nikalti thi.
//
// Yahan OSRM (OpenStreetMap ka routing engine) se asli raasta aata hai — wahi
// data jisse location search (utils/nominatim.js) chalti hai.
//
// Routing server kabhi bhi dheema ya band ho sakta hai, aur uski wajah se
// booking rukni nahi chahiye. Isliye:
//   • har jawab Redis mein cache hota hai (wahi do jagah dobara poochhi nahi jaati)
//   • chhota timeout hai
//   • fail hone par `null` — call karne wala seedhi doori par chala jaata hai
//
// OSRM_URL env se apna server lagaya ja sakta hai. Default public demo server
// hai, jiska koi SLA nahi — traffic badhne par apna OSRM chalana hi sahi hai.
// ─────────────────────────────────────────────────────────────────────────────
const axios = require('axios');
const redis = require('../config/redis');
const { calculateDistance } = require('./fareCalculator');

const BASE_URL   = (process.env.OSRM_URL || 'https://router.project-osrm.org').replace(/\/+$/, '');
const TIMEOUT_MS = 4000;
const TTL_SEC    = 7 * 24 * 60 * 60; // sadkein hafte bhar mein nahi badalti
// Map par dikhane ke liye itne point kaafi hain; zyada bhejne se app ka
// response bhaari hota hai aur farak dikhta nahi.
const MAX_POINTS = 120;

// ~11 metre tak gol — itne paas ke do pickup ka raasta ek hi hai, aur cache
// isi se kaam ka banta hai (GPS har baar thoda alag number deta hai).
const key4 = (n) => Number(n).toFixed(4);

const thin = (points) => {
  if (points.length <= MAX_POINTS) return points;
  const step = (points.length - 1) / (MAX_POINTS - 1);
  const out = [];
  for (let i = 0; i < MAX_POINTS; i += 1) out.push(points[Math.round(i * step)]);
  return out;
};

/**
 * Do jagahon ke beech sadak ka raasta.
 * @returns {Promise<null | { distanceKm: number, points: Array<{latitude, longitude}> }>}
 */
const getRoute = async (fromLat, fromLng, toLat, toLng) => {
  const nums = [fromLat, fromLng, toLat, toLng].map(Number);
  if (!nums.every(Number.isFinite)) return null;
  const [aLat, aLng, bLat, bLng] = nums;

  // route2: — samay (durationMin) wala naya roop; purani entry mein samay nahi tha
  const cacheKey = `route2:${key4(aLat)},${key4(aLng)}:${key4(bLat)},${key4(bLng)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache na chale to bhi routing chalni chahiye.
  }

  try {
    const url = `${BASE_URL}/route/v1/driving/${aLng},${aLat};${bLng},${bLat}`;
    const res = await axios.get(url, {
      params:  { overview: 'simplified', geometries: 'geojson', alternatives: false, steps: false },
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'GaonConnect/1.0' },
    });

    const route = res.data?.code === 'Ok' ? res.data.routes?.[0] : null;
    const coords = route?.geometry?.coordinates;
    if (!route || !Array.isArray(coords) || coords.length < 2) return null;

    const result = {
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      // OSRM khaali sadak ka samay deta hai — gaon ki sadak, mod, mandi ki
      // bheed ke liye 30% zyada (Rapido ka "safar ke samay" ka charge isi par).
      durationMin: Math.ceil((Number(route.duration) || 0) / 60 * 1.3),
      points: thin(coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))),
    };

    redis.setex(cacheKey, TTL_SEC, JSON.stringify(result)).catch(() => {});
    return result;
  } catch (err) {
    console.error('routing error:', err.code || err.message);
    return null;
  }
};

// Routing na chale to seedhi doori ka itna guna. Seedhi doori sadak se hamesha
// kam hoti hai — MP ke asli raaston par naapa: lambi trip 1.07–1.17x, shehar
// ke andar 1.5x tak. Seedhi doori par kiraya banane se driver ko 20-30% kam
// paisa milta tha.
const ROAD_FACTOR = 1.25;
// Andaaze wali doori itni der yaad — fare screen par jo dikha, booking par
// wahi lage (beech mein OSRM chal pada to bhi alag number na aaye).
const FALLBACK_TTL_SEC = 15 * 60;

/**
 * Trip ki doori — sadak se, aur wo na mile to seedhi × ROAD_FACTOR.
 * @returns {Promise<{ distance: number, straight: number, isRoad: boolean, points: Array }>}
 */
const measureTrip = async (fromLat, fromLng, toLat, toLng) => {
  const straight = calculateDistance(Number(fromLat), Number(fromLng), Number(toLat), Number(toLng));
  const fbKey = `routefb:${key4(fromLat)},${key4(fromLng)}:${key4(toLat)},${key4(toLng)}`;

  // Abhi-abhi andaaza diya tha to wahi — fare screen aur booking ek jaisi
  try {
    const fb = await redis.get(fbKey);
    if (fb) return { distance: Number(fb), straight, isRoad: false, points: [], durationMinutes: null };
  } catch { /* cache na chale to bhi chalo */ }

  const route = await getRoute(fromLat, fromLng, toLat, toLng);

  // Sadak ki doori seedhi se kam ho hi nahi sakti. Ho to data mein gadbad hai
  // (jaise pickup sadak se bahut door) — tab andaaze par.
  if (route && route.distanceKm >= straight) {
    return {
      distance: route.distanceKm, straight, isRoad: true, points: route.points,
      // Purane cache mein samay nahi — tab null (call karne wala andaaza lagaye)
      durationMinutes: Number(route.durationMin) > 0 ? route.durationMin : null,
    };
  }
  const estimate = Math.round(straight * ROAD_FACTOR * 100) / 100;
  redis.setex(fbKey, FALLBACK_TTL_SEC, String(estimate)).catch(() => {});
  return { distance: estimate, straight, isRoad: false, points: [], durationMinutes: null };
};

/**
 * Kai jagahon se hokar jaane wala raasta (pickup → stop → drop).
 * Har tukde ki doori judti hai. Koi ek tukda bhi sadak se na mile to
 * `isRoad` false — tab call karne wala savdhaani barat sakta hai.
 *
 * @param {Array<[number, number]>} stops  [[lat, lng], ...] — kam se kam do
 */
const measureLegs = async (stops) => {
  let distance = 0;
  let straight = 0;
  let isRoad   = true;
  let points   = [];
  let minutes  = 0;

  for (let i = 0; i < stops.length - 1; i += 1) {
    const leg = await measureTrip(stops[i][0], stops[i][1], stops[i + 1][0], stops[i + 1][1]);
    distance += leg.distance;
    straight += leg.straight;
    if (!leg.isRoad) isRoad = false;
    // Kisi tukde ka samay na mile to poore ka null — andaaza call karne wala lagaye
    minutes = minutes === null || !leg.durationMinutes ? null : minutes + leg.durationMinutes;
    points = points.concat(leg.points);
  }

  return {
    distance: Math.round(distance * 100) / 100,
    straight: Math.round(straight * 100) / 100,
    durationMinutes: minutes,
    isRoad,
    // Sab tukde sadak se mile tabhi poora raasta kheenchne layak hai.
    points: isRoad ? points : [],
  };
};

module.exports = { getRoute, measureTrip, measureLegs };
