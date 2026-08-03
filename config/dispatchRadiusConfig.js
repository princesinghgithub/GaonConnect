// ─────────────────────────────────────────────────────────────────────────────
// Progressive ride-dispatch radius — per vehicle type
// ─────────────────────────────────────────────────────────────────────────────
// Har vehicle type ke liye 4 stages (meters), najdeek se dur tak. Koi driver
// accept na kare to har DISPATCH_STAGE_DELAY_MS (rideController.js) baad agla
// (wider) stage try hota hai.
//
// Purana design sirf ek hi list [3km, 8km, 15km, unlimited] use karta tha sab
// vehicle types ke liye — "unlimited" ka matlab tha last stage pe DB ke jitne
// bhi online drivers hain sabko bhej do, chahe wo 200km dur hi kyun na ho. Ye
// tab theek tha jab sirf ek shehar mein chalta tha, lekin jaise hi service
// multiple cities/states (jaise MP) mein expand hoti hai, "unlimited" ek bahut
// dur wale driver ko bhi match kar sakta hai jo pickup tak pahunch hi nahi
// sakta — bekar wait aur cancellation deta hai.
//
// Isliye ab har vehicle type ka apna realistic max cap hai (last stage bhi ek
// real number hai, unlimited nahi):
//   - Bike/Auto: chhoti, intra-city rides — chhota radius, chhota cap
//   - Car: thoda bada, still mostly intra-city/nearby-town
//   - Tempo/Truck/Tractor/JCB: goods/farm kaam, aksar inter-village/inter-town
//     jaate hain — bada radius aur bada cap
//   - Ambulance: turant chahiye, lekin kabhi kabhi najdeek town se aana padta
//     hai — bike/auto se thoda zyada cap
//   - Wedding: aam taur pe advance planned, dur se bhi aana theek hai
//
// Admin panel se in values ko edit karna ho to isi pattern follow karo jo
// vehicleRates/hourlyRates (models/Setting.js) mein hai — DB-backed override +
// yahi file fallback default ke roop mein.
module.exports = {
  bike:      [2000, 4000,  6000,  8000],
  auto:      [2000, 4000,  6000,  8000],
  car:       [5000, 8000,  12000, 15000],
  tempo:     [5000, 10000, 15000, 25000],
  truck:     [5000, 10000, 20000, 35000],
  tractor:   [5000, 10000, 20000, 35000],
  jcb:       [5000, 10000, 20000, 35000],
  ambulance: [3000, 6000,  12000, 20000],
  wedding:   [8000, 15000, 25000, 40000],
};
