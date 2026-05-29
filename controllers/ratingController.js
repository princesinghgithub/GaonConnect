const Rating   = require('../models/Rating');
const Ride     = require('../models/Ride');
const Provider = require('../models/Provider');

const isDev = process.env.NODE_ENV !== 'production';

// ─── Helper: Provider ka average rating recalculate karo ─────────────────────
const recalcProviderRating = async (providerId) => {
  const ratings = await Rating.find({ provider: providerId, raterType: 'customer' });
  if (!ratings.length) return;

  const avg = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;

  // Breakdown count (1-5 stars)
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => { breakdown[r.stars] = (breakdown[r.stars] || 0) + 1; });

  await Provider.findByIdAndUpdate(providerId, {
    'rating.average':   parseFloat(avg.toFixed(1)),
    'rating.count':     ratings.length,
    'rating.breakdown': breakdown,
  });
};

// ─── POST /api/ratings/submit ─────────────────────────────────────────────────
// Customer → driver ko rate kare ya Driver → customer ko rate kare
exports.submitRating = async (req, res) => {
  try {
    const { rideId, stars, review, tags } = req.body;

    const ride = await Ride.findById(rideId)
      .populate('customer', 'name')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name' } });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });
    if (ride.status !== 'completed') return res.status(400).json({ success: false, message: 'Sirf completed ride rate kar sakte ho' });

    const isCustomer = ride.customer._id.toString() === req.user.id;
    const isDriver   = ride.provider?.user?._id?.toString() === req.user.id;

    if (!isCustomer && !isDriver) {
      return res.status(403).json({ success: false, message: 'Sirf is ride ke customer ya driver rate kar sakte hain' });
    }

    const raterType = isCustomer ? 'customer' : 'driver';

    // Already rated check
    const existing = await Rating.findOne({ ride: rideId, raterType });
    if (existing) return res.status(400).json({ success: false, message: 'Aap pehle se rate kar chuke hain' });

    const ratingData = {
      ride:      rideId,
      ratedBy:   req.user.id,
      raterType,
      stars,
      review:    review || '',
      tags:      tags   || [],
    };

    if (isCustomer) {
      ratingData.provider = ride.provider._id;
    } else {
      ratingData.customer = ride.customer._id;
    }

    const rating = await Rating.create(ratingData);

    // Customer ne diya → driver ka avg update karo
    if (isCustomer) {
      await recalcProviderRating(ride.provider._id);

      // Ride model mein bhi save karo
      await Ride.findByIdAndUpdate(rideId, { 'rating.customerRating': stars, 'rating.customerFeedback': review });
    } else {
      await Ride.findByIdAndUpdate(rideId, { 'rating.driverRating': stars, 'rating.driverFeedback': review });
    }

    return res.status(201).json({
      success: true,
      message: 'Rating de di gayi!',
      data: rating,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Aap pehle se rate kar chuke hain' });
    }
    console.error('Submit Rating Error:', error);
    return res.status(500).json({ success: false, message: 'Rating submit karne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── GET /api/ratings/provider/:providerId ────────────────────────────────────
exports.getProviderRatings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [ratings, total, provider] = await Promise.all([
      Rating.find({ provider: req.params.providerId, raterType: 'customer' })
        .populate('ratedBy', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Rating.countDocuments({ provider: req.params.providerId, raterType: 'customer' }),
      Provider.findById(req.params.providerId).select('rating'),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        summary: provider?.rating || { average: 0, count: 0 },
        ratings,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        total,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Ratings fetch karne mein error' });
  }
};

// ─── GET /api/ratings/ride/:rideId ────────────────────────────────────────────
// Ride ki dono ratings (customer aur driver) ek saath
exports.getRideRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ ride: req.params.rideId })
      .populate('ratedBy', 'name profilePhoto');

    const result = {
      customerRating: ratings.find((r) => r.raterType === 'customer') || null,
      driverRating:   ratings.find((r) => r.raterType === 'driver')   || null,
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Rating fetch karne mein error' });
  }
};

// ─── GET /api/ratings/pending ─────────────────────────────────────────────────
// Un rides ki list jo complete hain par rate nahi ki
exports.getPendingRatings = async (req, res) => {
  try {
    const isDriver = req.user.role === 'provider';
    let completedRides;

    if (isDriver) {
      const provider = await Provider.findOne({ user: req.user.id });
      if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

      completedRides = await Ride.find({ provider: provider._id, status: 'completed' })
        .populate('customer', 'name profilePhoto')
        .sort({ completedAt: -1 })
        .limit(50);
    } else {
      completedRides = await Ride.find({ customer: req.user.id, status: 'completed' })
        .populate({ path: 'provider', populate: { path: 'user', select: 'name profilePhoto' } })
        .sort({ completedAt: -1 })
        .limit(50);
    }

    const rideIds    = completedRides.map((r) => r._id);
    const raterType  = isDriver ? 'driver' : 'customer';
    const alreadyRated = await Rating.find({ ride: { $in: rideIds }, raterType }).select('ride');
    const ratedIds   = new Set(alreadyRated.map((r) => r.ride.toString()));

    const pending = completedRides.filter((r) => !ratedIds.has(r._id.toString()));

    return res.status(200).json({ success: true, data: pending, count: pending.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Pending ratings fetch karne mein error' });
  }
};
