// ─────────────────────────────────────────────────────────────────────────────
// Default vehicle variants — ek hi vehicle type ke andar alag-alag gaadiyan.
//
// "Car" ek gaadi nahi hai: Swift aur Ertiga dono car hain, par seat, mileage
// aur kiraya alag hai. Customer ko chunne dena hai ki use kaunsi chahiye, aur
// AC chahiye ya nahi.
//
// Ye values do jagah kaam aati hain:
//   1. Naya Setting document bante waqt seed (models/Setting.js)
//   2. Purane database mein, jahan car ke `variants` abhi hain hi nahi —
//      tab fareCalculator inhi ko use karta hai, taaki feature bina migration
//      ke chal jaaye.
//
// `minimumFare` / `perKmRate` null ho to us vehicle type ka apna rate lagta hai
// (yaani admin ne car ka jo rate rakha hai wahi). Isliye pehli category ka
// Non-AC daam wahi rehta hai jo is feature se pehle car ka tha.
//
// `acPerKm` — AC chalane par har km ka extra. Poori trip ki doori par lagta hai.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  car: [
    {
      id: 'hatchback', label: 'Mini', models: 'Swift, WagonR, Alto', seats: 4,
      minimumFare: null, perKmRate: null,
      acAvailable: true, nonAcAvailable: true, acPerKm: 2,
      isActive: true,
    },
    {
      id: 'sedan', label: 'Sedan', models: 'Dzire, Aura, Amaze', seats: 4,
      minimumFare: 100, perKmRate: 16,
      acAvailable: true, nonAcAvailable: true, acPerKm: 2,
      isActive: true,
    },
    {
      id: 'suv', label: 'SUV / 7 Seater', models: 'Ertiga, Innova, Bolero', seats: 6,
      minimumFare: 150, perKmRate: 20,
      acAvailable: true, nonAcAvailable: true, acPerKm: 3,
      isActive: true,
    },
  ],
};
