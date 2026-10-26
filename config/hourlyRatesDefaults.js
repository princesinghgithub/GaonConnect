// ─────────────────────────────────────────────────────────────────────────────
// Default Hourly/Per-KM Rates — Tractor, JCB, Thresher & Harvester
// Seeds the Setting document on first run; admin can edit values afterwards
// via /api/admin/hourly-rates (see adminController.getHourlyRates/updateHourlyRate).
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  tractor: [
    {
      id: 'farming', label: 'Farming', emoji: '🌾', pricingType: 'hourly',
      sub: [
        { id: 'ploughing',   label: 'Hal Chalana (Ploughing)',   rate: 750,  unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: true },
        { id: 'rotavator',   label: 'Rotavator (Jutai)',         rate: 850,  unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: true },
        { id: 'seed_drill',  label: 'Seed Drill (Beej Bona)',    rate: 650,  unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: true },
        { id: 'harvesting',  label: 'Katai (Harvesting)',        rate: 1100, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: true },
        // Neeche wale kaam auzaar ke hisaab se hain — booking sirf usi tractor
        // ko jaati hai jiske paas wo auzaar ho (utils/vehicleMatch.js).
        // Rate 0 + isActive:false — har ilaake ka daam alag hai, admin bharega
        // tab customer ko dikhenge (thresher/harvester wala hi niyam).
        { id: 'cultivator',    label: 'Cultivator (Jutai)',           rate: 0, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: false },
        { id: 'land_leveling', label: 'Khet Samtal (Leveler)',        rate: 0, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: false },
        // Thresher alag gaadi nahi, kheti ka kaam hai — gaon mein thresher
        // tractor se hi chalta hai. Booking sirf thresher wale tractor ko
        // jaati hai (utils/vehicleMatch.js SERVICE_EQUIPMENT).
        { id: 'threshing',     label: 'Thresher (Daana Nikalna)',     rate: 0, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: false },
      ],
    },
    {
      // Katai ke baad ka kaam — bhusa, gaanth.
      id: 'post_harvest', label: 'Bhusa / Gaanth', emoji: '🌾', pricingType: 'hourly',
      sub: [
        { id: 'straw_reaper', label: 'Bhusa Banana (Straw Reaper)', rate: 0, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: false },
        { id: 'baling',       label: 'Gaanth Banana (Baler)',       rate: 0, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: false },
      ],
    },
    {
      id: 'transport', label: 'Saamaan Dhona', emoji: '🚛', pricingType: 'per_km',
      travelCharge: { enabled: false, amount: 0 }, freeArrivalKm: 5,
      // Pehle ye 150 ka minimum code mein likha tha; ab setting hai, admin
      // apne ilaake ke hisaab se badal sakta hai.
      minimumFare: 150,
      sub: [
        { id: 'crop_transport', label: 'Fasal Dhona',            rate: 18, unit: 'km', minimumQuantity: 1, isActive: true },
        { id: 'sand_brick',     label: 'Ret / Eent',             rate: 22, unit: 'km', minimumQuantity: 1, isActive: true },
        { id: 'goods',          label: 'Saamaan Dhona',          rate: 20, unit: 'km', minimumQuantity: 1, isActive: true },
      ],
    },
    {
      id: 'spraying', label: 'Spraying', emoji: '💧', pricingType: 'hourly',
      sub: [
        { id: 'spray',         label: 'Spray (Dawai Chhidkao)',      rate: 500, unit: 'hour', minimumHours: 1 },
        { id: 'grass_cutting', label: 'Grass Cutting (Ghaas Katna)', rate: 600, unit: 'hour', minimumHours: 1 },
        { id: 'cleaning',      label: 'Cleaning (Safai)',            rate: 400, unit: 'hour', minimumHours: 1 },
      ],
    },
    {
      id: 'water', label: 'Water', emoji: '🚿', pricingType: 'hourly',
      sub: [
        { id: 'tanker',     label: 'Tanker (Paani Dhona)', rate: 700, unit: 'hour', minimumHours: 1 },
        { id: 'irrigation', label: 'Irrigation (Sinchai)', rate: 600, unit: 'hour', minimumHours: 1 },
      ],
    },
    {
      id: 'custom', label: 'Custom', emoji: '⚙️', pricingType: 'hourly',
      sub: [
        { id: 'custom_request', label: 'Koi Aur Kaam', rate: 750, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: true },
        { id: 'post_hole',      label: 'Gaddhe Karna (Post Hole Digger)', rate: 0, unit: 'hour', minimumHours: 1, perAcreRate: 0, isActive: false },
      ],
    },
  ],
  jcb: [
    {
      id: 'construction', label: 'JCB ka Kaam', emoji: '🏗️', pricingType: 'hourly',
      // JCB ko site tak laane ka charge — admin chaahe to on kare.
      travelCharge: { enabled: false, amount: 0 }, freeArrivalKm: 5,
      sub: [
        { id: 'digging',      label: 'Khudai (Digging)',        rate: 1400, unit: 'hour', minimumHours: 1, isActive: true },
        { id: 'leveling',     label: 'Samtal Karna (Levelling)', rate: 1150, unit: 'hour', minimumHours: 1, isActive: true },
        { id: 'loading',      label: 'Loading',                 rate: 1250, unit: 'hour', minimumHours: 1, isActive: true },
        { id: 'construction', label: 'Nirmaan (Construction)',  rate: 1300, unit: 'hour', minimumHours: 1, isActive: true },
        // Attachment wale kaam — sirf breaker/auger wale JCB ko jaate hain
        { id: 'breaking',     label: 'Todna (Breaker)',          rate: 0, unit: 'hour', minimumHours: 1, isActive: false },
        { id: 'drilling',     label: 'Gaddha / Drill (Auger)',   rate: 0, unit: 'hour', minimumHours: 1, isActive: false },
      ],
    },
    {
      id: 'custom', label: 'Custom', emoji: '⚙️', pricingType: 'hourly',
      sub: [
        { id: 'custom_request', label: 'Koi Aur Kaam', rate: 1400, unit: 'hour', minimumHours: 1, isActive: true },
      ],
    },
  ],

  // Thresher aur Harvester ke rate jaan-bujhkar 0 aur isActive:false hain.
  // Inka rate har gaon aur har fasal ke hisaab se alag hota hai — ek all-India
  // number daal dena kisi bhi jagah galat hi hoga. Admin apne ilaake ka rate
  // bharega, tab ye services customer ko dikhengi.
  thresher: [
    {
      id: 'threshing', label: 'Thresher ka Kaam', emoji: '🌾', pricingType: 'hourly',
      travelCharge: { enabled: false, amount: 0 }, freeArrivalKm: 5,
      sub: [
        { id: 'per_hour',    label: 'Ghante ke hisaab se',  rate: 0, unit: 'hour',    minimumHours: 1,    isActive: false },
        { id: 'per_acre',    label: 'Acre ke hisaab se',    rate: 0, unit: 'acre',    minimumQuantity: 1, isActive: false },
        { id: 'per_quintal', label: 'Quintal ke hisaab se', rate: 0, unit: 'quintal', minimumQuantity: 1, isActive: false },
        { id: 'fixed_job',   label: 'Poore kaam ka daam',   rate: 0, unit: 'job',     minimumQuantity: 1, isActive: false },
      ],
    },
  ],

  harvester: [
    {
      id: 'harvesting', label: 'Katai (Harvesting)', emoji: '🌾', pricingType: 'per_acre',
      travelCharge: { enabled: false, amount: 0 }, freeArrivalKm: 5,
      sub: [
        { id: 'wheat',   label: 'Gehun (Wheat)',  rate: 0, unit: 'acre', minimumQuantity: 1, isActive: false },
        { id: 'paddy',   label: 'Dhaan (Paddy)',  rate: 0, unit: 'acre', minimumQuantity: 1, isActive: false },
        { id: 'soybean', label: 'Soyabean',       rate: 0, unit: 'acre', minimumQuantity: 1, isActive: false },
        { id: 'gram',    label: 'Chana (Gram)',   rate: 0, unit: 'acre', minimumQuantity: 1, isActive: false },
        { id: 'other',   label: 'Koi Aur Fasal',  rate: 0, unit: 'acre', minimumQuantity: 1, isActive: false },
      ],
    },
  ],
};
