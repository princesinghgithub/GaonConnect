// ─────────────────────────────────────────────────────────────────────────────
// Maximum trip (pickup → drop) distance — per vehicle type
// ─────────────────────────────────────────────────────────────────────────────
// Ye dispatchRadiusConfig.js se ALAG cheez hai — wo control karta hai driver
// pickup se kitna dur ho to use request mile; ye control karta hai ki ride
// khud (pickup se drop tak) kitni lambi ho sakti hai.
//
// Pehle koi bhi limit nahi thi — koi bhi bike book karke 200km ki trip bana
// sakta tha, jo us vehicle type ke liye realistic nahi hai (driver thak
// jayega, bike ka fuel/maintenance issue hoga). Chhoti/local-use gaadiyon
// (bike/auto/tractor/JCB) ka max kam rakha hai, lambi-trip wali gaadiyon
// (car/truck/tempo/wedding) ka zyada.
//
// Values kilometers mein hain.
module.exports = {
  bike:      40,
  auto:      40,
  car:       150,
  tempo:     100,
  truck:     200,
  tractor:   60,
  jcb:       60,
  ambulance: 150,
  wedding:   250,
};
