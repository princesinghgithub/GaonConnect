const Joi = require('joi');

// ─── Validation middleware factory ───────────────────────────────────────────
const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'query' ? req.query : source === 'params' ? req.params : req.body;
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, '')).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }

  // Replace source with sanitised value
  if (source === 'query')  req.query  = value;
  else if (source === 'params') req.params = value;
  else req.body = value;

  next();
};

// ─── Schemas ──────────────────────────────────────────────────────────────────
const phone = Joi.string()
  .pattern(/^[6-9][0-9]{9}$/)
  .required()
  .messages({ 'string.pattern.base': '10 digit valid Indian phone number daalo (6-9 se shuru)' });

const otp = Joi.string()
  .length(6)
  .pattern(/^\d+$/)
  .required()
  .messages({ 'string.length': 'OTP 6 digits ka hona chahiye', 'string.pattern.base': 'OTP sirf numbers hone chahiye' });

const schemas = {
  // Auth
  register: Joi.object({
    name:  Joi.string().min(2).max(50).required().messages({ 'string.min': 'Name kam se kam 2 characters ka hona chahiye' }),
    phone,
    email: Joi.string().email().required().messages({ 'string.email': 'Valid email daalo' }),
    city:  Joi.string().max(100).optional().allow(''),
    role:  Joi.string().valid('customer', 'provider').default('customer'),
  }),

  sendOTP: Joi.object({
    email: Joi.string().email().required().messages({ 'string.email': 'Valid email daalo' }),
  }),

  verifyOTP: Joi.object({
    email: Joi.string().email().required(),
    otp,
  }),

  sendPhoneOTP: Joi.object({ phone }),

  verifyPhoneOTP: Joi.object({
    phone,
    otp,
    name:  Joi.string().min(2).max(50).optional(),
    city:  Joi.string().max(100).optional().allow(''),
    email: Joi.string().email().optional().allow(''),
    role:  Joi.string().valid('customer', 'provider').optional(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({ 'any.required': 'refreshToken required hai' }),
  }),

  updateProfile: Joi.object({
    name:  Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    city:  Joi.string().max(100).optional().allow(''),
  }),

  // Ride
  // NOTE: pickup/drop yahan flat {address, latitude, longitude} hain — yeh
  // dono apps (userApp confirm-booking.tsx aur tractor-booking.tsx) jo bhejte
  // hain usse match karta hai. `fare`/`estimatedFare` accept karte hain sirf
  // backward-compat ke liye — server inhe IGNORE karta hai aur khud fare
  // calculate karta hai (dekho rideController.js createRide).
  createRide: Joi.object({
    pickup: Joi.object({
      address:   Joi.string().required(),
      latitude:  Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
    drop: Joi.object({
      address:   Joi.string().required(),
      latitude:  Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    }),
    dropoff: Joi.object({
      address:   Joi.string().required(),
      latitude:  Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    }),
    // Vehicle types are admin-managed (Setting.vehicleRates), not a fixed
    // list — fareCalculator falls back to 'auto' pricing for unknown types.
    vehicleType:        Joi.string().lowercase().required(),
    distance:           Joi.number().min(0).required(),
    estimatedDuration:  Joi.number().min(0).required(),
    fare:               Joi.number().min(0).optional(),
    estimatedFare:      Joi.number().min(0).optional(),
    paymentMethod:      Joi.string().valid('cash', 'online', 'wallet').default('cash'),
    bookingType:        Joi.string().valid('instant', 'scheduled').default('instant'),
    scheduledAt:        Joi.date().iso().optional().allow(null),
    scheduledNote:      Joi.string().max(500).optional().allow(''),
    bookingMode:        Joi.string().valid('distance', 'hourly').default('distance'),
    serviceCategory:    Joi.string().optional().allow(''),
    serviceType:        Joi.string().optional().allow(''),
    estimatedHours:     Joi.number().min(0).optional(),
    hourlyRate:         Joi.number().min(0).optional(),
    workNote:           Joi.string().max(500).optional().allow(''),
    promoCode:          Joi.string().optional().allow(null, ''),
  }).or('drop', 'dropoff'),

  // Wallet
  requestWithdrawal: Joi.object({
    amount: Joi.number().min(100).required()
      .messages({ 'number.min': 'Minimum withdrawal amount ₹100 hai' }),
  }),

  // Fare estimate query params
  fareEstimate: Joi.object({
    pickupLat: Joi.number().min(-90).max(90).required(),
    pickupLng: Joi.number().min(-180).max(180).required(),
    dropLat:   Joi.number().min(-90).max(90).required(),
    dropLng:   Joi.number().min(-180).max(180).required(),
  }),
};

module.exports = { validate, schemas };
