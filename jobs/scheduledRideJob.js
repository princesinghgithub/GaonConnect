// ══════════════════════════════════════════════════
// File: GaonConnect_backend/jobs/scheduledRideJob.js
// ══════════════════════════════════════════════════
const cron     = require('node-cron');
const Ride     = require('../models/Ride');
const Provider = require('../models/Provider');
const Vehicle  = require('../models/Vehicle');
const User     = require('../models/User');
const { getIO } = require('../socket');
const { notify } = require('../utils/notifications');

const startScheduledRideJob = () => {
  // Har 2 minute mein scheduled rides check karo
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
        // isOnline/'available' check nahi — app band ho tab bhi driver ko
        // push notification chahiye (jaise tractor/JCB waale jo hamesha
        // app khole nahi baithte). Sirf 'busy' (kisi aur ride pe) waalon
        // ko skip karo.
        const matchingVehicles = await Vehicle.find({ type: ride.vehicleType, isVerified: true }).select('_id');
        const matchingVehicleIds = matchingVehicles.map((v) => v._id);

        const drivers = await Provider.find({
          isApproved:    true,
          isBlocked:     { $ne: true },
          status:        { $ne: 'busy' },
          activeVehicle: { $in: matchingVehicleIds },
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
          isScheduled:     true,
          scheduledTime,
          scheduledNote:   ride.scheduledNote   || '',
          bookingMode:     ride.bookingMode     || 'distance',
          serviceCategory: ride.serviceCategory || '',
          serviceType:     ride.serviceType     || '',
          estimatedHours:  ride.estimatedHours  || 0,
          hourlyRate:      ride.hourlyRate       || 0,
          workNote:        ride.workNote         || '',
        };

        drivers.forEach(driver => {
          // Socket — agar driver app khula/connected hai to turant dikhega
          io.to(`driver_${driver._id}`).emit('newRideRequest', payload);

          // FCM push — app band ho ya driver offline ho, tab bhi phone pe
          // notification pahunche
          const fcm = driver.deviceInfo?.fcmToken;
          if (fcm) {
            notify.scheduledRideReminder(fcm, payload).catch(() => {});
          }

          console.log(`🔔 Scheduled ride → ${driver.user?.name} | ${scheduledTime}`);
        });

        // Status update karo — searchingSince ABHI set karo, createdAt (jo
        // booking-time hai, ghanto/din purana ho sakta hai) nahi. Neeche wala
        // auto-cancel job isi field se stale rides pehchanta hai.
        ride.status = 'searching';
        ride.searchingSince = new Date();
        await ride.save();
      }
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  });

  console.log('✅ Scheduled ride cron job started (every 2 min)');

  // Har 5 minute mein: 'searching' rides jo 10+ min purani hain unhe auto-cancel karo
  cron.schedule('*/5 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 10 * 60 * 1000);
      const stale = await Ride.find({
        status:   'searching',
        provider: null,
        // searchingSince = jab ride actually searching mein aayi (instant ride
        // ke liye creation time, scheduled ride ke liye activation time).
        // Purani (pre-migration) rides jinme yeh field nahi hai unke liye
        // createdAt pe fallback karo.
        $or: [
          { searchingSince: { $lt: cutoff } },
          { searchingSince: null, createdAt: { $lt: cutoff } },
        ],
      });

      if (!stale.length) return;

      const io = getIO();
      for (const ride of stale) {
        ride.status             = 'cancelled';
        ride.cancelledBy        = 'admin';
        ride.cancellationReason = 'Koi driver available nahi mila (auto-cancel)';
        ride.cancelledAt        = new Date();
        await ride.save();

        io.to(`user_${ride.customer}`).emit('rideCancelled', { rideId: ride._id, reason: 'Koi driver nahi mila. Dobara try karein.' });
        console.log(`🚫 Auto-cancelled stale ride: ${ride._id}`);
      }
    } catch (err) {
      console.error('Auto-cancel cron error:', err.message);
    }
  });

  // Roz midnight pe todayEarnings reset karo
  cron.schedule('0 0 * * *', async () => {
    try {
      await Provider.updateMany({}, { 'stats.todayEarnings': 0 });
      console.log('🔄 todayEarnings reset for all providers');
    } catch (err) {
      console.error('Earnings reset cron error:', err.message);
    }
  });
};

module.exports = { startScheduledRideJob };
