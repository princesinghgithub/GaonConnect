// Shared between the landing-page hero widget and BookRide.jsx so both
// offer the exact same Tractor/JCB service catalogue and pricing.
export const TRACTOR_SERVICES = [
  {
    id: 'farming', label: '🌾 Farming (Khet ka Kaam)', pricingType: 'hourly',
    sub: [
      { id: 'ploughing',    label: 'Ploughing — Hal Chalana',      rate: 800 },
      { id: 'rotavator',   label: 'Rotavator — Jutai',             rate: 900 },
      { id: 'cultivator',  label: 'Cultivator',                    rate: 700 },
      { id: 'seed_drill',  label: 'Seed Drill — Beej Bona',        rate: 700 },
      { id: 'laser',       label: 'Laser Land Leveler',            rate: 1000 },
      { id: 'reaper',      label: 'Reaper — Katai',                rate: 1100 },
      { id: 'thresher',    label: 'Thresher',                      rate: 1000 },
    ],
  },
  {
    id: 'transport', label: '🚛 Transport — Trolley / Dhalai', pricingType: 'per_km',
    sub: [
      { id: 'crop_transport', label: 'Crop / Fasal',               rate: 20 },
      { id: 'sand_brick',     label: 'Sand / Brick — Ret/Eent',    rate: 25 },
      { id: 'goods',          label: 'Goods — Saman Dhona',        rate: 22 },
    ],
  },
  {
    id: 'spraying', label: '💧 Spraying / Dawai', pricingType: 'hourly',
    sub: [
      { id: 'spray',        label: 'Spray — Dawai Chhidkao',       rate: 500 },
      { id: 'grass_cut',    label: 'Grass Cutting',                rate: 600 },
    ],
  },
  {
    id: 'custom', label: '⚙️ Custom / Koi Bhi Kaam', pricingType: 'hourly',
    sub: [{ id: 'custom_request', label: 'Custom Request',         rate: 800 }],
  },
];

export const JCB_SERVICES = [
  {
    id: 'construction', label: '🏗️ Construction / Khudai', pricingType: 'hourly',
    sub: [
      { id: 'digging',   label: 'Digging — Khudai',               rate: 1500 },
      { id: 'leveling',  label: 'Leveling — Samatlana',            rate: 1200 },
      { id: 'loading',   label: 'Loading — Maal Uthaana',          rate: 1300 },
      { id: 'construct', label: 'Construction — Nirmaan',          rate: 1400 },
    ],
  },
  {
    id: 'custom', label: '⚙️ Custom / Koi Bhi Kaam', pricingType: 'hourly',
    sub: [{ id: 'custom_request', label: 'Custom Request',        rate: 1500 }],
  },
];

export const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8, 12];
