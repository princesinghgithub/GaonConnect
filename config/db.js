const mongoose = require('mongoose');

// Schema badalne par Mongoose sirf naye indexes add karta hai — jo index schema se
// hata diya gaya ho wo DB mein pada rehta hai (jaise 'vehicle.number_1' migration ke
// baad bhi mahino tak pada raha, har naye driver ka registration block karta raha).
// syncIndexes() dono karta hai: missing indexes banata hai + stale wale drop karta hai —
// har startup pe, taaki future schema changes mein ye class of bug dobara na aaye.
const syncAllIndexes = async () => {
  for (const name of mongoose.modelNames()) {
    try {
      await mongoose.model(name).syncIndexes();
    } catch (error) {
      console.error(`⚠️  Index sync failed for model "${name}": ${error.message}`);
    }
  }
  console.log('✅ MongoDB indexes synced (stale indexes dropped, missing ones created)');
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await syncAllIndexes();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
