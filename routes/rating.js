const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const {
  submitRating,
  getProviderRatings,
  getRideRatings,
  getPendingRatings,
} = require('../controllers/ratingController');

const ratingSchema = Joi.object({
  rideId: Joi.string().required(),
  stars:  Joi.number().min(1).max(5).required()
    .messages({ 'number.min': '1 se 5 ke beech rating do', 'number.max': '1 se 5 ke beech rating do' }),
  review: Joi.string().max(300).optional().allow(''),
  tags:   Joi.array().items(Joi.string()).optional(),
});

// Rating submit (customer → driver ya driver → customer)
router.post('/submit', protect, validate(ratingSchema), submitRating);

// Driver ki saari ratings
router.get('/provider/:providerId', getProviderRatings);

// Ride ki ratings
router.get('/ride/:rideId', protect, getRideRatings);

// Pending ratings (jo rides rate nahi ki abhi tak)
router.get('/pending', protect, getPendingRatings);

module.exports = router;
