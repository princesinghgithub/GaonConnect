const Rating = require('../models/Rating');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');

// @desc    Create rating
// @route   POST /api/ratings/create
// @access  Private
exports.createRating = async (req, res) => {
  try {
    const { bookingId, providerId, rating, review, photos } = req.body;

    // Validation
    if (!bookingId || !providerId || !rating || !rating.overall) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({ booking: bookingId });
    
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this booking'
      });
    }

    // Create rating
    const newRating = await Rating.create({
      booking: bookingId,
      user: req.user.id,
      provider: providerId,
      rating,
      review,
      photos
    });

    // Update provider's average rating
    const provider = await Provider.findById(providerId);
    const allRatings = await Rating.find({ provider: providerId });
    
    const totalRating = allRatings.reduce((sum, r) => sum + r.rating.overall, 0);
    const avgRating = totalRating / allRatings.length;

    provider.rating.average = avgRating.toFixed(1);
    provider.rating.count = allRatings.length;
    await provider.save();

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    console.error('Create Rating Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating rating',
      error: error.message
    });
  }
};

// @desc    Get provider ratings
// @route   GET /api/ratings/provider/:providerId
// @access  Public
exports.getProviderRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ provider: req.params.providerId })
      .populate('user', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: ratings.length,
      ratings
    });
  } catch (error) {
    console.error('Get Provider Ratings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings',
      error: error.message
    });
  }
};

// @desc    Get user's ratings
// @route   GET /api/ratings/user
// @access  Private
exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ user: req.user.id })
      .populate('provider', 'vehicle rating')
      .populate('booking', 'service trackingId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ratings.length,
      ratings
    });
  } catch (error) {
    console.error('Get User Ratings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings',
      error: error.message
    });
  }
};