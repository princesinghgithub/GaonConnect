// ══════════════════════════════════════════════════
// File: GaonConnect_backend/jobs/scheduledRideJob.js
// ══════════════════════════════════════════════════
const cron     = require('node-cron');
const Ride     = require('../models/Ride');
const Provider = require('../models/Provider');
const User     = require('../models/User');
const { getIO } = require('../socket');

const startScheduledRideJob = () => {
  // Har 2 minute mein check karo
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now  = new Date();
      const in15 = new Date(now.getTime() + 15 * 60 * 1000);

      // Rides jo abhi scheduled hain aur 15 min mein honi hain
      const rides = await Ride.find({
        bookingType: 'scheduled',
        status:      'scheduled',
        scheduledAt: { $gte: now, $lte: in15 },
      }).populate('customer', 'name phone');

      if (rides.length > 0) console.log(`⏰ ${rides.length} scheduled rides notify karne hain`);

      for (const ride of rides) {
        const drivers = await Provider.find({
          isOnline:       true,
          isApproved:     true,
          isBlocked:      { $ne: true },
          status:         'available',
          'vehicle.type': ride.vehicleType,
        }).populate('user', 'name phone');

        const io = getIO();
        const scheduledTime = new Date(ride.scheduledAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });

        const payload = {
          rideId:        ride._id,
          customerName:  ride.customer?.name  || 'Customer',
          customerPhone: ride.customer?.phone || '',
          pickup: {
            address:   ride.pickup.address,
            latitude:  ride.pickup.coordinates?.latitude,
            longitude: ride.pickup.coordinates?.longitude,
          },
          drop: {
            address:   ride.drop.address,
            latitude:  ride.drop.coordinates?.latitude,
            longitude: ride.drop.coordinates?.longitude,
          },
          fare:          ride.fare,
          distance:      ride.distance,
          vehicleType:   ride.vehicleType,
          paymentMethod: ride.paymentMethod,
          isScheduled:   true,
          scheduledTime,
          scheduledNote: ride.scheduledNote || '',
        };

        drivers.forEach(driver => {
          io.to(`driver_${driver._id}`).emit('newRideRequest', payload);
          console.log(`🔔 Scheduled ride → ${driver.user?.name} | ${scheduledTime}`);
        });

        // Status update karo
        ride.status = 'searching';
        await ride.save();
      }
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  });

  console.log('✅ Scheduled ride cron job started (every 2 min)');
};

module.exports = { startScheduledRideJob };
