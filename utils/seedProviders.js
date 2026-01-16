const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Provider = require('../models/Provider');
const User = require('../models/User');

dotenv.config();

const sampleProviders = [
  {
    name: 'Ramesh Kumar',
    phone: '9876543210',
    city: 'Indore',
    vehicleType: 'auto',
    vehicleNumber: 'MP09 AB 1234',
    vehicleModel: 'Bajaj RE',
    rating: 4.8,
    trips: 450
  },
  {
    name: 'Suresh Patel',
    phone: '9876543211',
    city: 'Indore',
    vehicleType: 'bike',
    vehicleNumber: 'MP09 CD 5678',
    vehicleModel: 'Honda Activa',
    rating: 4.9,
    trips: 320
  },
  {
    name: 'Mohan Singh',
    phone: '9876543212',
    city: 'Indore',
    vehicleType: 'tractor',
    vehicleNumber: 'MP09 TR 9012',
    vehicleModel: 'John Deere',
    rating: 4.7,
    trips: 180
  },
  {
    name: 'Vijay Sharma',
    phone: '9876543213',
    city: 'Indore',
    vehicleType: 'car',
    vehicleNumber: 'MP09 EF 9012',
    vehicleModel: 'Maruti Swift',
    rating: 4.6,
    trips: 280
  }
];

const seedProviders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing providers
    await Provider.deleteMany();
    console.log('🗑️ Cleared existing providers');

    // Create providers
    for (const providerData of sampleProviders) {
      // Create or find user
      let user = await User.findOne({ phone: providerData.phone });
      
      if (!user) {
        user = await User.create({
          name: providerData.name,
          phone: providerData.phone,
          city: providerData.city,
          role: 'provider',
          isVerified: true
        });
      }

      // Create provider
      await Provider.create({
        user: user._id,
        vehicle: {
          type: providerData.vehicleType,
          number: providerData.vehicleNumber,
          model: providerData.vehicleModel
        },
        rating: {
          average: providerData.rating,
          count: providerData.trips
        },
        stats: {
          totalTrips: providerData.trips,
          completedTrips: providerData.trips,
          totalEarnings: providerData.trips * 150
        },
        status: 'available',
        isApproved: true,
        isOnline: true
      });
    }

    console.log('✅ Sample providers created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedProviders();