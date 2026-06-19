require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  name:       'Prince Patel',
  phone:      '6260132613',
  email:      'gaonconnect.in@gmail.com',
  city:       'Rewa',
  role:       'admin',
  roles:      ['admin'],
  isVerified: true,
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');

  // Phone se existing user dhundo
  const existing = await User.findOne({ phone: ADMIN.phone });
  if (existing) {
    existing.role       = 'admin';
    existing.roles      = ['admin'];
    existing.email      = ADMIN.email;
    existing.name       = ADMIN.name;
    existing.city       = ADMIN.city;
    existing.isVerified = true;
    await existing.save();
    console.log('Existing user admin bana diya:', existing.email, '| id:', existing._id);
    process.exit(0);
  }

  const admin = await User.create(ADMIN);
  console.log('Admin user created:', admin.email, '| id:', admin._id);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
