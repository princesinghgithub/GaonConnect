const PromoCode = require('../models/PromoCode');
const Ride      = require('../models/Ride');

const isDev = process.env.NODE_ENV !== 'production';

// ─── Helper: Promo validate + discount calculate ──────────────────────────────
const validateAndCalculate = async (code, userId, fare, vehicleType) => {
  const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() });

  if (!promo)      return { valid: false, message: 'Promo code galat hai' };
  if (!promo.isActive) return { valid: false, message: 'Yeh promo code active nahi hai' };

  const now = new Date();
  if (now < promo.validFrom)   return { valid: false, message: 'Yeh promo code abhi start nahi hua' };
  if (now > promo.validUntil)  return { valid: false, message: 'Promo code expire ho gaya' };
  if (promo.maxUses && promo.usedCount >= promo.maxUses) return { valid: false, message: 'Promo code limit khatam ho gayi' };
  if (fare < promo.minFare)    return { valid: false, message: `Minimum ₹${promo.minFare} ka ride chahiye is code ke liye` };

  // Vehicle restriction check
  if (promo.applicableVehicles?.length && !promo.applicableVehicles.includes(vehicleType)) {
    return { valid: false, message: `Yeh code sirf ${promo.applicableVehicles.join(', ')} ke liye hai` };
  }

  // Specific users check
  if (promo.applicableUsers?.length && !promo.applicableUsers.some((u) => u.toString() === userId)) {
    return { valid: false, message: 'Yeh promo code aapke liye nahi hai' };
  }

  // Per-user use count check
  const userUseCount = promo.usedBy.filter((u) => u.user.toString() === userId).length;
  if (userUseCount >= promo.maxUsesPerUser) {
    return { valid: false, message: 'Aap yeh code pehle use kar chuke hain' };
  }

  // First ride only check
  if (promo.firstRideOnly) {
    const prevRides = await Ride.countDocuments({ customer: userId, status: 'completed' });
    if (prevRides > 0) return { valid: false, message: 'Yeh code sirf pehli ride ke liye hai' };
  }

  // Discount calculate
  let discount = 0;
  if (promo.discountType === 'percent') {
    discount = Math.round(fare * promo.discountValue / 100);
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  } else {
    discount = Math.min(promo.discountValue, fare); // flat discount, fare se zyada nahi
  }

  const finalFare = Math.max(fare - discount, 0);

  return { valid: true, promo, discount, finalFare, message: `₹${discount} ki discount mili!` };
};

// ─── POST /api/promo/validate ─────────────────────────────────────────────────
exports.validatePromo = async (req, res) => {
  try {
    const { code, fare, vehicleType } = req.body;
    if (!code || !fare) return res.status(400).json({ success: false, message: 'code aur fare required hai' });

    const result = await validateAndCalculate(code, req.user.id, Number(fare), vehicleType);

    if (!result.valid) return res.status(400).json({ success: false, message: result.message });

    return res.status(200).json({
      success:  true,
      message:  result.message,
      data: {
        code:        result.promo.code,
        description: result.promo.description,
        discount:    result.discount,
        finalFare:   result.finalFare,
        originalFare: fare,
        discountType:  result.promo.discountType,
        discountValue: result.promo.discountValue,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Promo validate karne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── POST /api/promo/apply  (rideController se call hoti hai internally) ──────
// Returns discount amount or 0
exports.applyPromoToRide = async (code, userId, fare, vehicleType, rideId) => {
  if (!code) return { discount: 0, finalFare: fare };

  const result = await validateAndCalculate(code, userId, fare, vehicleType);
  if (!result.valid) return { discount: 0, finalFare: fare, error: result.message };

  // Mark as used
  await PromoCode.findByIdAndUpdate(result.promo._id, {
    $inc: { usedCount: 1 },
    $push: { usedBy: { user: userId, ride: rideId, usedAt: new Date() } },
  });

  return { discount: result.discount, finalFare: result.finalFare };
};

// ─── GET /api/promo/available ─────────────────────────────────────────────────
exports.getAvailablePromos = async (req, res) => {
  try {
    const now = new Date();
    const promos = await PromoCode.find({
      isActive:   true,
      validFrom:  { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { applicableUsers: { $size: 0 } },
        { applicableUsers: req.user.id },
      ],
    }).select('code description discountType discountValue maxDiscount minFare firstRideOnly validUntil applicableVehicles');

    return res.status(200).json({ success: true, data: promos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Promos fetch karne mein error' });
  }
};

// ─── ADMIN: POST /api/promo/create ────────────────────────────────────────────
exports.createPromo = async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue, maxDiscount,
      minFare, maxUses, maxUsesPerUser, firstRideOnly,
      validUntil, applicableVehicles,
    } = req.body;

    const promo = await PromoCode.create({
      code, description, discountType, discountValue,
      maxDiscount: maxDiscount || null,
      minFare:     minFare     || 0,
      maxUses:     maxUses     || null,
      maxUsesPerUser: maxUsesPerUser || 1,
      firstRideOnly: firstRideOnly  || false,
      validUntil:  new Date(validUntil),
      applicableVehicles: applicableVehicles || [],
      createdBy:   req.user.id,
    });

    return res.status(201).json({ success: true, message: 'Promo code ban gaya!', data: promo });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Yeh code pehle se exist karta hai' });
    return res.status(500).json({ success: false, message: 'Promo create karne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── ADMIN: GET /api/promo/all ────────────────────────────────────────────────
exports.getAllPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 }).select('-usedBy');
    return res.status(200).json({ success: true, data: promos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Promos fetch karne mein error' });
  }
};

// ─── ADMIN: PUT /api/promo/:id/toggle ────────────────────────────────────────
exports.togglePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo nahi mila' });

    promo.isActive = !promo.isActive;
    await promo.save();

    return res.status(200).json({
      success: true,
      message: `Promo ${promo.isActive ? 'active' : 'deactive'} ho gaya`,
      data: promo,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Toggle karne mein error' });
  }
};
