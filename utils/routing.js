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

// ─── Google Routes (traffic ke saath) ────────────────────────────────────────
// App mein map Google ka hai — par doori/samay OSRM (OpenStreetMap) se aate
// the. Gaon mein OSM par kai sadkein hi nahi hoti, to OSRM lamba ghoom kar
// raasta banata ya fail hota, aur jo map par dikhta usse doori alag hoti.
// GOOGLE_ROUTES_API_KEY ho to doori, traffic wala samay aur raasta Google se —
// wahi jo customer/driver map par dekhte hain. Na ho / fail ho to OSRM.
//
// Traffic badalta rehta hai, isliye 10 min ka cache — itni der fare screen
// aur booking ek hi number dekhte hain (Rapido bhi kuch der baad naya daam deta hai).
const GOOGLE_KEY      = process.env.GOOGLE_ROUTES_API_KEY || '';
const GOOGLE_URL      = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GOOGLE_TTL_SEC  = 10 * 60;
const SEGMENT_POINTS  = 40; // har traffic tukde mein itne point kaafi

// Google ka encoded polyline → [{latitude, longitude}]
const decodePolyline = (str) => {
  const out = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
};

const thinTo = (points, max) => {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i += 1) out.push(points[Math.round(i * step)]);
  return out;
};

// Google ka speed → hamara naam: 'normal' (hara/neela), 'slow' (peela), 'jam' (laal)
const SPEED = { NORMAL: 'normal', SLOW: 'slow', TRAFFIC_JAM: 'jam' };

const googleRoute = async (aLat, aLng, bLat, bLng) => {
  const latLng = (latitude, longitude) => ({ location: { latLng: { latitude, longitude } } });
  const res = await axios.post(GOOGLE_URL, {
    origin: latLng(aLat, aLng),
    destination: latLng(bLat, bLng),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    extraComputations: ['TRAFFIC_ON_POLYLINE'],
    polylineQuality: 'OVERVIEW',
    languageCode: 'en-IN',
    units: 'METRIC',
  }, {
    timeout: TIMEOUT_MS,
    headers: {
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.staticDuration,routes.polyline.encodedPolyline,routes.travelAdvisory.speedReadingIntervals',
    },
  });
  const route = res.data?.routes?.[0];
  const encoded = route?.polyline?.encodedPolyline;
  if (!route || !encoded || !(Number(route.distanceMeters) > 0)) return null;

  const all = decodePolyline(encoded);
  const sec = (d) => Number(String(d || '0').replace('s', '')) || 0;
  const traffic = (route.travelAdvisory?.speedReadingIntervals || [])
    .map((iv) => {
      const from = Number(iv.startPolylinePointIndex) || 0;
      const to = Number(iv.endPolylinePointIndex) || 0;
      const pts = all.slice(from, to + 1);
      return pts.length > 1 ? { speed: SPEED[iv.speed] || 'normal', points: thinTo(pts, SEGMENT_POINTS) } : null;
    })
    .filter(Boolean);

  const trafficMin = Math.ceil(sec(route.duration) / 60);
  const freeMin = Math.ceil(sec(route.staticDuration) / 60);
  return {
    distanceKm: Math.round((Number(route.distanceMeters) / 1000) * 100) / 100,
    // Traffic wala asli samay (Google) — buffer nahi chahiye
    durationMin: trafficMin || freeMin || null,
    // Jaam se kitne minute zyada lag rahe (UI mein "8 min jaam" dikhane ke liye)
    trafficDelayMin: Math.max(0, trafficMin - freeMin),
    points: thin(all),
    traffic,
    provider: 'google',
  };
};

/**
 * Do jagahon ke beech sadak ka raasta.
 * @returns {Promise<null | { distanceKm, durationMin, points, traffic?, trafficDelayMin?, provider }>}
 */
// opts.cacheOnly — sirf yaad kiya hua raasta (network nahi); na ho to null
const getRoute = async (fromLat, fromLng, toLat, toLng, opts = {}) => {
  const nums = [fromLat, fromLng, toLat, toLng].map(Number);
  if (!nums.every(Number.isFinite)) return null;
  const [aLat, aLng, bLat, bLng] = nums;
  const pair = `${key4(aLat)},${key4(aLng)}:${key4(bLat)},${key4(bLng)}`;

  // Pehle Google (key ho to)
  if (GOOGLE_KEY) {
    const gKey = `groute:${pair}`;
    try {
      const cached = await redis.get(gKey);
      if (cached) return JSON.parse(cached);
    } catch { /* cache na chale to bhi routing */ }
    if (!opts.cacheOnly) try {
      const g = await googleRoute(aLat, aLng, bLat, bLng);
      if (g) {
        redis.setex(gKey, GOOGLE_TTL_SEC, JSON.stringify(g)).catch(() => {});
        return g;
      }
    } catch (err) {
      console.error('google routes error:', err.response?.status || err.code || err.message, err.response?.data?.error?.message || '');
    }
  }

  // route2: — samay (durationMin) wala naya roop; purani entry mein samay nahi tha
  const cacheKey = `route2:${pair}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache na chale to bhi routing chalni chahiye.
  }
  if (opts.cacheOnly) return null;

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
      traffic: [],
      provider: 'osrm',
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

  // Pehle yaad kiya hua ASLI raasta — wo ho to andaaze se behtar. Pehle andaaza
  // pehle dekha jaata tha: routing ek baar der se aayi to 15 min tak andaaza hi
  // lagta raha (galat doori, map par line nahi), routing theek hone ke baad bhi.
  const known = await getRoute(fromLat, fromLng, toLat, toLng, { cacheOnly: true });
  if (known && known.distanceKm >= straight * 0.85) {
    return {
      distance: known.distanceKm, straight, isRoad: true, points: known.points,
      durationMinutes: Number(known.durationMin) > 0 ? known.durationMin : null,
      traffic: Array.isArray(known.traffic) ? known.traffic : [],
      trafficDelayMin: Number(known.trafficDelayMin) || 0,
      provider: known.provider || 'osrm',
    };
  }

  // Abhi-abhi andaaza diya tha to wahi — fare screen aur booking ek jaisi
  try {
    const fb = await redis.get(fbKey);
    if (fb) return { distance: Number(fb), straight, isRoad: false, points: [], durationMinutes: null, traffic: [], trafficDelayMin: 0, provider: 'estimate' };
  } catch { /* cache na chale to bhi chalo */ }

  const route = await getRoute(fromLat, fromLng, toLat, toLng);

  // Sadak ki doori seedhi se bahut kam ho hi nahi sakti. Thoda kam ho sakta
  // hai — routing jagah ko paas ki sadak par khiskaata hai (400 m ki trip par
  // 0.38 vs 0.41 km). Pehle zara bhi kam hone par raasta "galat" maan kar
  // andaaza lagta tha aur map par line hi nahi aati thi. 15% se zyada kam ho
  // tabhi gadbad (jaise pickup sadak se bahut door) — tab andaaze par.
  if (route && route.distanceKm >= straight * 0.85) {
    return {
      distance: route.distanceKm, straight, isRoad: true, points: route.points,
      // Purane cache mein samay nahi — tab null (call karne wala andaaza lagaye)
      durationMinutes: Number(route.durationMin) > 0 ? route.durationMin : null,
      // Raaste ki line par jaam wale tukde (sirf Google se) — apps/website laal dikhati hain
      traffic: Array.isArray(route.traffic) ? route.traffic : [],
      trafficDelayMin: Number(route.trafficDelayMin) || 0,
      provider: route.provider || 'osrm',
    };
  }
  const estimate = Math.round(straight * ROAD_FACTOR * 100) / 100;
  redis.setex(fbKey, FALLBACK_TTL_SEC, String(estimate)).catch(() => {});
  return { distance: estimate, straight, isRoad: false, points: [], durationMinutes: null, traffic: [], trafficDelayMin: 0, provider: 'estimate' };
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
  let traffic  = [];
  let delay    = 0;

  for (let i = 0; i < stops.length - 1; i += 1) {
    const leg = await measureTrip(stops[i][0], stops[i][1], stops[i + 1][0], stops[i + 1][1]);
    distance += leg.distance;
    straight += leg.straight;
    if (!leg.isRoad) isRoad = false;
    // Kisi tukde ka samay na mile to poore ka null — andaaza call karne wala lagaye
    minutes = minutes === null || !leg.durationMinutes ? null : minutes + leg.durationMinutes;
    points = points.concat(leg.points);
    traffic = traffic.concat(leg.traffic || []);
    delay += Number(leg.trafficDelayMin) || 0;
  }

  return {
    distance: Math.round(distance * 100) / 100,
    straight: Math.round(straight * 100) / 100,
    durationMinutes: minutes,
    traffic: isRoad ? traffic : [],
    trafficDelayMin: delay,
    isRoad,
    // Sab tukde sadak se mile tabhi poora raasta kheenchne layak hai.
    points: isRoad ? points : [],
  };
};

module.exports = { getRoute, measureTrip, measureLegs, decodePolyline };
