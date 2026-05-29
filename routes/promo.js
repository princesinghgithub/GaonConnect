const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const { protect, admin } = require('../middleware/auth');
const { validate }       = require('../middleware/validate');
const {
  validatePromo, getAvailablePromos,
  createPromo, getAllPromos, togglePromo,
} = require('../controllers/promoController');

const promoValidateSchema = Joi.object({
  code:        Joi.string().required(),
  fare:        Joi.number().positive().required(),
  vehicleType: Joi.string().valid('auto','bike','car','tractor','tempo','truck','jcb').optional(),
});

const promoCreateSchema = Joi.object({
  code:               Joi.string().uppercase().min(3).max(20).required(),
  description:        Joi.string().max(200).optional().allow(''),
  discountType:       Joi.string().valid('percent', 'flat').required(),
  discountValue:      Joi.number().positive().required(),
  maxDiscount:        Joi.number().optional().allow(null),
  minFare:            Joi.number().min(0).optional(),
  maxUses:            Joi.number().optional().allow(null),
  maxUsesPerUser:     Joi.number().min(1).default(1),
  firstRideOnly:      Joi.boolean().default(false),
  validUntil:         Joi.date().iso().required(),
  applicableVehicles: Joi.array().items(Joi.string()).optional(),
});

// User routes
router.post('/validate',  protect, validate(promoValidateSchema), validatePromo);
router.get('/available',  protect, getAvailablePromos);

// Admin routes
router.post('/create',    protect, admin, validate(promoCreateSchema), createPromo);
router.get('/all',        protect, admin, getAllPromos);
router.put('/:id/toggle', protect, admin, togglePromo);

module.exports = router;
