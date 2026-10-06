// public/ mein asli gaadi aur upkaran ki photos padi hain. Pehle services har
// jagah sirf emoji se dikhti thi, jo villager ko yeh nahi batati ki asal mein
// aayegi kya. Yahan ek hi jagah mapping rakhi hai taaki landing page aur
// BookRide dono ek jaisi photo dikhayein.
//
// Paths /vehicles/ ki taraf jaate hain, seedhe public/ ki taraf nahi. Wo
// scripts/normalize_service_images.py se bani copies hain: har photo ka baked-in
// English label kata hua aur sabka naap ek jaisa (400x300), taaki grid mein har
// card barabar dikhe. Nayi photo public/ mein daalne ke baad wo script chala dena.
//
// Jis service ki photo na ho uske liye entry nahi hai — call karne wala apne
// purane emoji/icon par gir jaata hai.

// Landing page ki har service ke saath judi cheezein — ek hi jagah, id se.
// Pehle ye chaar alag arrays mein bandhi thi (i18n ke items, FARE_TYPE_BY_INDEX,
// VEHICLE_TYPE_BY_INDEX aur basePrices) aur sab sirf index se jude the: ek
// service hataate hi baaki sab khisak jaate aur galat gaadi book ho jaati.
// Ab i18n items mein bhi "id" hai, isliye kram badalne se kuch nahi tootta.
//
// fareType  = hero ka live kiraya-anumaan is formula se banta hai (null = anumaan nahi)
// vehicleType = BookRide.jsx post-login jis gaadi ko samajhta hai (null = aage nahi le jaana)
export const LANDING_SERVICES = {
  bike:        { image: '/vehicles/bike.webp',      fareType: null,   vehicleType: 'bike',    basePrice: 20 },
  auto:        { image: '/vehicles/auto.webp',      fareType: 'auto', vehicleType: 'auto',    basePrice: 50 },
  car:         { image: '/vehicles/car.webp',       fareType: 'car',  vehicleType: 'car',     basePrice: 100 },
  tractor:     { image: '/vehicles/tractor.webp',   fareType: null,   vehicleType: 'tractor', basePrice: 400 },
  // Tempo aur Pickup ek hi gaadi-type hai backend mein ("tempo") — app mein
  // bhi "Tempo / Pickup" naam se ek hi card. Wedding car band hai.
  tempo:       { image: '/vehicles/pickup.webp',    fareType: null,   vehicleType: 'tempo',   basePrice: 150 },
  jcb:         { image: '/vehicles/jcb.webp',       fareType: null,   vehicleType: 'jcb',     basePrice: 1000 },
  // Thresher alag gaadi nahi — tractor ka Farming › Thresher kaam. preset se
  // wahi kaam pehle se chuna aata hai.
  thresher:    { image: '/vehicles/thresher.webp',  fareType: null,   vehicleType: 'tractor', basePrice: 800,
                 preset: { categoryId: 'farming', serviceId: 'threshing' } },
  harvester:   { image: '/vehicles/harvester.webp', fareType: null,   vehicleType: 'harvester', basePrice: 1500 },
};

// Kaam wali gaadiyan — inke liye pehle kaam chunna padta hai (Rate Card se)
export const WORK_VEHICLE_TYPES = ['tractor', 'jcb', 'harvester'];

// BookRide ke "Choose Vehicle" cards vehicleType se chalte hain, index se nahi.
export const VEHICLE_IMAGES = {
  bike:    '/vehicles/bike.webp',
  auto:    '/vehicles/auto.webp',
  car:     '/vehicles/car.webp',
  tempo:   '/vehicles/pickup.webp',
  tractor: '/vehicles/tractor.webp',
  jcb:     '/vehicles/jcb.webp',
  harvester: '/vehicles/harvester.webp',
};

// Tractor/JCB ki sub-services backend se aati hain (GET /ride/services/:type).
// Keys wahi ids hain jo backend bhejta hai — naya id add hone par yahan entry
// na ho to picker bina photo ke chalta rahega, tootega nahi.
export const SUB_SERVICE_IMAGES = {
  // Tractor — farming
  ploughing:      '/vehicles/plough.webp',
  rotavator:      '/vehicles/rotavator.webp',
  seed_drill:     '/vehicles/seed_drill.webp',
  harvesting:     '/vehicles/harvester.webp',
  // Tractor — transport
  crop_transport: '/vehicles/trolley.webp',
  sand_brick:     '/vehicles/tipper.webp',
  goods:          '/vehicles/trailer.webp',
  // Tractor — spraying
  spray:          '/vehicles/sprayer.webp',
  grass_cutting:  '/vehicles/straw_reaper.webp',
  cleaning:       '/vehicles/rake.webp',
  // Tractor — water
  tanker:         '/vehicles/water_tanker.webp',
  irrigation:     '/vehicles/water_tanker.webp',
  // JCB — construction
  digging:        '/vehicles/jcb_excavator.webp',
  leveling:       '/vehicles/leveler.webp',
  loading:        '/vehicles/jcb_loader.webp',
  construction:   '/vehicles/jcb_backhoe.webp',
  // Auzaar wale kaam (Rate Card se chalu hote hi website par)
  cultivator:     '/cultivator.webp',
  land_leveling:  '/vehicles/leveler.webp',
  threshing:      '/vehicles/thresher.webp',
  straw_reaper:   '/vehicles/straw_reaper.webp',
  baling:         '/baler.webp',
  post_hole:      '/post_hole_digger.webp',
  breaking:       '/jcb_breaker.webp',
  drilling:       '/earth_auger.webp',
  // Thresher ka kaam (ghanta / acre / quintal) aur harvester ki fasalein
  per_hour:       '/vehicles/thresher.webp',
  per_acre:       '/vehicles/thresher.webp',
  per_quintal:    '/vehicles/thresher.webp',
  fixed_job:      '/vehicles/thresher.webp',
  wheat:          '/vehicles/harvester.webp',
  paddy:          '/vehicles/harvester.webp',
  soybean:        '/vehicles/harvester.webp',
  gram:           '/vehicles/harvester.webp',
  other:          '/vehicles/harvester.webp',
};
