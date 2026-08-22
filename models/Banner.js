const mongoose = require('mongoose');

// Home screen ke promotional banners — Rapido/Uber jaise.
//
// Poori tarah server-driven hain, isliye naya offer/tyohaar ka banner lagane ke
// liye app ka naya release nahi chahiye. Yahi wajah hai ki unke banners hafte
// mein badal jaate hain aur hamare pehle hardcoded the.
//
// Image zaroori nahi hai: sirf title + subtitle + rang se bhi banner ban jaata
// hai. Isse tyohaar ya achanak wale offer turant chaalu ho jaate hain, kisi
// designer ka intezaar kiye bina.
const BannerSchema = new mongoose.Schema({
  title: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 60,
  },

  subtitle: {
    type:      String,
    trim:      true,
    default:   '',
    maxlength: 100,
  },

  // Chhota emoji — image na ho to yahi banner ka chehra banta hai.
  emoji: { type: String, default: '', trim: true },

  // Cloudinary URL. Ho to image dikhti hai, warna title/subtitle/rang.
  imageUrl: { type: String, default: '', trim: true },

  // Do rang = gradient; ek = flat. App inhi ko seedha use karti hai, isliye
  // brand ke bahar ka rang bhi admin bina deploy ke chala sakta hai.
  bgColorStart: { type: String, default: '#1a3a5c' },
  bgColorEnd:   { type: String, default: '#0f2438' },
  textColor:    { type: String, default: '#ffffff' },

  // Tap karne par kya ho.
  //   screen — app ke andar ka raasta (jaise "/(tabs)/offers")
  //   url    — bahar browser mein
  //   none   — sirf padhne ke liye
  actionType: {
    type:    String,
    enum:    ['none', 'screen', 'url'],
    default: 'none',
  },
  actionValue: { type: String, default: '', trim: true },

  // Kis app mein dikhe.
  audience: {
    type:    String,
    enum:    ['customer', 'driver', 'all'],
    default: 'customer',
  },

  // Bada number pehle dikhta hai.
  priority: { type: Number, default: 0 },

  // Tyohaar wale banners pehle se schedule ho sakte hain aur apne aap hat
  // jaate hain — kisi ko yaad rakh kar band nahi karna padta.
  startsAt: { type: Date, default: Date.now },
  endsAt:   { type: Date, default: null },

  isActive: { type: Boolean, default: true },

  // Kitni baar dikha aur kitni baar tap hua — ye jaane bina pata nahi chalta
  // ki banner kaam kar raha hai ya bas jagah ghere baitha hai.
  impressions: { type: Number, default: 0 },
  clicks:      { type: Number, default: 0 },
}, { timestamps: true });

// App ki query: audience + active + date window, priority se sorted.
BannerSchema.index({ audience: 1, isActive: 1, startsAt: 1, endsAt: 1, priority: -1 });

module.exports = mongoose.model('Banner', BannerSchema);
