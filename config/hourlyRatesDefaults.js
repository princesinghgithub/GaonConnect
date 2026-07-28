// ─────────────────────────────────────────────────────────────────────────────
// Default Hourly/Per-KM Rates — Tractor & JCB
// Seeds the Setting document on first run; admin can edit values afterwards
// via /api/admin/hourly-rates (see adminController.getHourlyRates/updateHourlyRate).
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  tractor: [
    {
      id: 'farming', label: 'Farming', emoji: '🌾', pricingType: 'hourly',
      sub: [
        { id: 'ploughing',   label: 'Ploughing (Hal Chalana)',   rate: 800,  minimumHours: 1 },
        { id: 'rotavator',   label: 'Rotavator (Jutai)',         rate: 900,  minimumHours: 1 },
        { id: 'seed_drill',  label: 'Seed Drill (Beej Bona)',    rate: 700,  minimumHours: 1 },
        { id: 'harvesting',  label: 'Harvesting (Katai)',        rate: 1200, minimumHours: 1 },
      ],
    },
    {
      id: 'transport', label: 'Transport', emoji: '🚛', pricingType: 'per_km',
      sub: [
        { id: 'crop_transport', label: 'Crop Transport (Fasal Dhona)', rate: 20, minimumHours: 1 },
        { id: 'sand_brick',     label: 'Sand / Brick (Ret/Eent)',      rate: 25, minimumHours: 1 },
        { id: 'goods',          label: 'Goods (Saman Dhona)',         rate: 22, minimumHours: 1 },
      ],
    },
    {
      id: 'spraying', label: 'Spraying', emoji: '💧', pricingType: 'hourly',
      sub: [
        { id: 'spray',         label: 'Spray (Dawai Chhidkao)',      rate: 500, minimumHours: 1 },
        { id: 'grass_cutting', label: 'Grass Cutting (Ghaas Katna)', rate: 600, minimumHours: 1 },
        { id: 'cleaning',      label: 'Cleaning (Safai)',            rate: 400, minimumHours: 1 },
      ],
    },
    {
      id: 'water', label: 'Water', emoji: '🚿', pricingType: 'hourly',
      sub: [
        { id: 'tanker',     label: 'Tanker (Paani Dhona)', rate: 700, minimumHours: 1 },
        { id: 'irrigation', label: 'Irrigation (Sinchai)', rate: 600, minimumHours: 1 },
      ],
    },
    {
      id: 'custom', label: 'Custom', emoji: '⚙️', pricingType: 'hourly',
      sub: [
        { id: 'custom_request', label: 'Custom Request', rate: 800, minimumHours: 1 },
      ],
    },
  ],
  jcb: [
    {
      id: 'construction', label: 'Construction', emoji: '🏗️', pricingType: 'hourly',
      sub: [
        { id: 'digging',      label: 'Digging (Khudai)',        rate: 1500, minimumHours: 1 },
        { id: 'leveling',     label: 'Leveling (Samatlana)',    rate: 1200, minimumHours: 1 },
        { id: 'loading',      label: 'Loading (Maal Uthaana)',  rate: 1300, minimumHours: 1 },
        { id: 'construction', label: 'Construction (Nirmaan)',  rate: 1400, minimumHours: 1 },
      ],
    },
    {
      id: 'custom', label: 'Custom', emoji: '⚙️', pricingType: 'hourly',
      sub: [
        { id: 'custom_request', label: 'Custom Request', rate: 1500, minimumHours: 1 },
      ],
    },
  ],
};
