// ─────────────────────────────────────────────────────────────────────────────
// Band ki gayi sevayein — Truck/Goods, Ambulance, Wedding Car.
//
// Business ne inhe hataane ka faisla kiya hai. Rate card (Setting.vehicleRates)
// mein inki entry purane database mein reh sakti hai, isliye "isActive" par
// nahi chhoda: yahan likhi gaadi na customer ki suchi mein aati hai, na driver
// registration mein, aur iski nayi booking bhi nahi banti.
//
// Purani bookings / registered gaadiyan jaisi hain waisi rehti hain — sirf
// naya kaam band hai. Kisi ko wapas chalu karna ho to yahan se hata do.
// ─────────────────────────────────────────────────────────────────────────────
// 'thresher' — alag gaadi ke roop mein band; ab yeh Tractor ka kaam hai
// ("Thresher / Bhusa" → "threshing"), jo sirf thresher wale tractor ko jaata hai.
module.exports = ['truck', 'goods', 'ambulance', 'wedding', 'thresher'];
