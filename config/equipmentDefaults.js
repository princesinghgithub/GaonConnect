// ─────────────────────────────────────────────────────────────────────────────
// Gaadi ke saath kya-kya aata hai — implements/attachments aur gaadi ka variant.
//
// Ab tak booking mein sirf "kaam kya hai" poochha jaata tha (jutai, khudai).
// Driver ko yeh pata nahi chalta tha ki khet par kaunsa auzaar leke aana hai,
// aur kitni takat wali gaadi chahiye. Nateeja wahi hota tha jo gaon mein hota
// hai: driver 35 HP ka tractor leke pahunchta, kaam 50 HP ka nikalta, aur
// dono ka aadha din kharab hota.
//
// Do alag cheezein hain, aur inhe alag rakhna zaroori hai:
//   • equipment — jo gaadi ke PEECHE judta hai (hal, rotavator, trolley;
//     JCB mein bucket, hammer). Ek se zyada ho sakte hain.
//   • variants  — gaadi khud kis naap ki hai (40-50 HP, JCB 3DX). Ek hi hoga.
//
// Rate yahan jaan-bujhkar NAHI hai. HP ya attachment se daam badalna ek
// business faisla hai (aur har ilaake mein alag), code ka andaaza nahi. Abhi
// yeh sirf "driver kya leke aaye" batate hain — daam wahi rehta hai jo service
// ka rate card kehta hai. Jis din admin HP-wise rate rakhna chahe, `priceDelta`
// jaisa field yahin add hoga aur fareCalculator use padhega.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  tractor: {
    /** Ek hi chunna hai. Pehla `isDefault` wala pehle se chuna aata hai. */
    // `hourlyRate` — HP se daam badalta hai. Bada tractor zyada diesel peeta
    // hai aur bhaari upkaran kheenchta hai, isliye uska ghanta mehnga hai.
    //
    // Yeh rate service ke rate card se AAGE nahi, uski JAGAH lagta hai: jab
    // customer HP chunta hai to fare usi se banta hai. HP na chuna gaya ho
    // (ya kisi variant ka rate 0 ho) to service ka apna rate chalta hai.
    variantLabel: 'Tractor chunein',
    variants: [
      { id: 'hp_45', label: '45 HP Tractor', hourlyRate: 800 },
      { id: 'hp_50', label: '50 HP Tractor', hourlyRate: 900, isDefault: true },
      { id: 'hp_55', label: '55 HP Tractor', hourlyRate: 1000 },
    ],

    /**
     * Ek se zyada chun sakte hain.
     *
     * `icon` app ki tasveer ka id hai (userApp/constants/vehicleImages.ts).
     * Jiski tasveer nahi hai uska icon khaali chhoda hai — app wahan sirf
     * naam dikhati hai. Galat tasveer lagane se naam hi behtar hai.
     */
    equipmentLabel: 'Kaunsa upkaran chahiye?',
    equipment: [
      { id: 'plough',     label: 'Hal (Plough)',           icon: 'plough' },
      { id: 'rotavator',  label: 'Rotavator',              icon: 'rotavator' },
      { id: 'cultivator', label: 'Cultivator',             icon: 'cultivator' },
      { id: 'seed_drill', label: 'Seed Drill',             icon: 'seed_drill' },
      { id: 'trolley',    label: 'Trolley',                icon: 'trolley' },
      { id: 'leveler',    label: 'Leveler (Samtalikaran)', icon: 'leveler' },
      { id: 'thresher',   label: 'Thresher',               icon: 'thresher' },

      // Yeh nau pehle nahi the. Inki tasveerein app mein aa chuki hain, aur
      // ye har us kisan ka asli auzaar hai jiska kaam sirf jutai-buwai nahi
      // hai — "Anya upkaran" chunkar note mein likhna padta tha, jise driver
      // aksar padhta hi nahi.
      { id: 'water_tanker',       label: 'Paani ka Tanker',        icon: 'water_tanker' },
      { id: 'sprayer',            label: 'Sprayer (Dawai)',        icon: 'sprayer' },
      { id: 'straw_reaper',       label: 'Straw Reaper (Bhusa)',   icon: 'straw_reaper' },
      { id: 'baler',              label: 'Baler (Gaanth)',         icon: 'baler' },
      { id: 'rake',               label: 'Rake',                   icon: 'rake' },
      { id: 'trailer',            label: 'Trailer',                icon: 'trailer' },
      { id: 'laser_land_leveler', label: 'Laser Land Leveler',     icon: 'laser_land_leveler' },
      { id: 'post_hole_digger',   label: 'Post Hole Digger',       icon: 'post_hole_digger' },
      { id: 'earth_auger',        label: 'Earth Auger',            icon: 'earth_auger' },

      { id: 'other',      label: 'Anya upkaran',           icon: '' },
    ],

    /**
     * Kuch upkaran chunne par ek aur sawaal uthta hai. Trolley "kitne khol ki"
     * — do khol aur chaar khol ki dhulai alag hoti hai, aur driver ko pehle se
     * pata hona chahiye.
     */
    followUps: {
      trolley: {
        label: 'Trolley ka prakar',
        options: [
          { id: 'trolley_2', label: '2 khol trolley', isDefault: true },
          { id: 'trolley_4', label: '4 khol trolley' },
          { id: 'trolley_tipper', label: 'Tipper trolley' },
        ],
      },
    },
  },

  jcb: {
    // 2DX/3DX/4DX sab backhoe loader hain — unki tasveer ek hi hai, isliye
    // wahan icon nahi diya (ek hi tasveer chaar baar dikhana shor hai).
    // Excavator, wheel loader aur telehandler alag machine hain, aur unki
    // tasveer se customer turant samajh jaata hai ki wo kya maang raha hai.
    variantLabel: 'JCB prakar chunein',
    variants: [
      { id: 'jcb_3dx', label: 'JCB 3DX', hourlyRate: 1200, icon: 'jcb_backhoe', isDefault: true },
      { id: 'jcb_4dx', label: 'JCB 4DX', hourlyRate: 1400, icon: 'jcb_backhoe' },
      { id: 'jcb_5dx', label: 'JCB 5DX', hourlyRate: 1600, icon: 'jcb_backhoe' },
      { id: 'jcb_excavator',   label: 'Excavator (Chain)', hourlyRate: 1500, icon: 'jcb_excavator' },
      { id: 'jcb_loader',      label: 'Wheel Loader',      hourlyRate: 1300, icon: 'jcb_loader' },
      { id: 'jcb_telehandler', label: 'Telehandler',       hourlyRate: 1450, icon: 'jcb_telehandler' },
    ],

    // Bucket/ripper/pallet-fork ki tasveer abhi nahi hai — unka icon khaali
    // hai aur app naam hi dikhati hai. Galat tasveer lagane se behtar hai.
    equipmentLabel: 'Kaunsa attachment chahiye?',
    equipment: [
      { id: 'bucket',       label: 'Bucket (Saamaanya)', icon: '' },
      { id: 'breaker',      label: 'Breaking Hammer',    icon: 'jcb_breaker' },
      { id: 'auger',        label: 'Auger Drill',        icon: 'earth_auger' },
      { id: 'ripper',       label: 'Ripper',             icon: '' },
      { id: 'pallet_fork',  label: 'Pallet Fork',        icon: '' },
      { id: 'compressor',   label: 'Compressor',         icon: 'compressor' },
      { id: 'generator',    label: 'Generator',          icon: 'generator' },
      { id: 'other',        label: 'Anya attachment',    icon: '' },
    ],

    followUps: {},
  },
  // (Car ka "shaadi ki booking bhi lunga" wala option tha — Wedding Car seva
  // band hone par hata diya; dekho config/retiredVehicleTypes.js.)
};
