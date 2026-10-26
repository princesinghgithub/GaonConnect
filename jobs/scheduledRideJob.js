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
const {
  dispatchDueRides, dispatchRideStage, markNextDispatch, activationLeadMs, scheduleLabel,
} = require('../controllers/rideController');
const { releasePromo } = require('../controllers/promoController');

// ─────────────────────────────────────────────────────────────────────────────
// Pre-booking (Rapido jaisa):
//   • booking hote hi drivers ko request jaati hai; jo accept kare wo PAKKA
//     driver (status 'scheduled' + provider) — customer use dekh/call kar sakta
//   • samay se ~12 ghante pehle dono ko ek yaad-dihani
//   • samay se pehle (tractor/JCB 60 min, sawaari 30 min) pakki booking chalu
//     → 'accepted': driver ki ride screen, customer ki live tracking
//   • tab tak bhi koi driver nahi mila → normal tez search (waves)
// Pehle sirf aakhri 15 minute mein dhoondha jaata tha — kal ki jutai ka
// driver raat bhar tay nahi hota tha, aur na mile to booking wahin cancel.
// ─────────────────────────────────────────────────────────────────────────────
const MAX_LEAD_MS = 60 * 60 * 1000;
const REMINDER_BEFORE_MS = 12 * 60 * 60 * 1000;

const runScheduledTick = async () => {
  const now = Date.now();
  const io = getIO();

  // ── 1. Yaad-dihani (pakki bookings) ───────────────────────────────────────
  const remind = await Ride.find({
    status: 'scheduled',
    provider: { $ne: null },
    scheduleReminderAt: null,
    scheduledAt: { $lte: new Date(now + REMINDER_BEFORE_MS), $gt: new Date(now + MAX_LEAD_MS) },
  }).populate('customer', 'name fcmToken').populate({ path: 'provider', populate: { path: 'user', select: 'name' } });

  for (const ride of remind) {
    const when = scheduleLabel(ride.scheduledAt);
    const driverName = ride.provider?.user?.name || 'Driver';
    if (ride.provider?.deviceInfo?.fcmToken) {
      notify.custom(ride.provider.deviceInfo.fcmToken, {
        title: '⏰ Pre-Booking Yaad Rakhein',
        body:  `${ride.customer?.name || 'Customer'} — ${when}. ${ride.pickup.address}`,
        data:  { type: 'SCHEDULED_REMINDER', rideId: String(ride._id) },
      }).catch(() => {});
    }
    if (ride.customer?.fcmToken) {
      notify.custom(ride.customer.fcmToken, {
        title: '⏰ Aapki Pre-Booking',
        body:  `${driverName} ${when} ko aayenge.`,
        data:  { type: 'SCHEDULED_REMINDER', rideId: String(ride._id) },
      }).catch(() => {});
    }
    await Ride.updateOne({ _id: ride._id }, { scheduleReminderAt: new Date() });
  }

  // ── 2 + 3. Samay aa gaya ──────────────────────────────────────────────────
  const due = await Ride.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date(now + MAX_LEAD_MS) },
  }).populate('customer', 'name phone fcmToken');

  for (const ride of due) {
    if (new Date(ride.scheduledAt).getTime() - now > activationLeadMs(ride.vehicleType)) continue;

    if (ride.provider) {
      // Pakki booking chalu — driver ko "nikalo", customer ko live tracking
      const updated = await Ride.findOneAndUpdate(
        { _id: ride._id, status: 'scheduled', provider: ride.provider },
        { status: 'accepted', acceptedAt: new Date(), nextDispatchAt: null },
        { new: true },
      );
      if (!updated) continue;
      const provider = await Provider.findByIdAndUpdate(ride.provider, { status: 'busy' }, { new: true })
        .populate('user', 'name');
      const when = scheduleLabel(ride.scheduledAt);

      io.to(`driver_${ride.provider}`).emit('scheduledRideActivated', { rideId: String(ride._id) });
      if (provider?.deviceInfo?.fcmToken) {
        notify.custom(provider.deviceInfo.fcmToken, {
          title: '🚜 Pre-Booking ka samay — nikalein',
          body:  `${ride.customer?.name || 'Customer'} — ${when}. ${ride.pickup.address}`,
          data:  { type: 'SCHEDULED_RIDE_ACTIVATED', rideId: String(ride._id) },
        }).catch(() => {});
      }
      io.to(`user_${ride.customer?._id}`).emit('rideAccepted', { rideId: ride._id, driverId: ride.provider, otp: ride.otp });
      if (ride.customer?.fcmToken) {
        notify.custom(ride.customer.fcmToken, {
          title: '🚜 Driver nikal rahe hain',
          body:  `${provider?.user?.name || 'Driver'} ${when} ki booking ke liye aa rahe hain. OTP: ${ride.otp}`,
          data:  { type: 'RIDE_ACCEPTED', rideId: String(ride._id) },
        }).catch(() => {});
      }
      console.log(`✅ Pre-booking chalu: ${ride._id} → driver ${ride.provider}`);
      continue;
    }

    // Abhi tak koi driver nahi — normal tez search. Pehle jinhe bheja tha
    // (shayad offline the) unhe bhi dobara: notifiedDrivers khaali.
    const opened = await Ride.findOneAndUpdate(
      { _id: ride._id, status: 'scheduled', provider: null },
      { status: 'searching', searchingSince: new Date(), notifiedDrivers: [], dispatchStageIndex: 0, nextDispatchAt: null },
      { new: true },
    );
    if (!opened) continue;
    await dispatchRideStage(opened._id, 0);
    await markNextDispatch(opened._id, 0);
    console.log(`🔎 Pre-booking ka driver tay nahi tha — ab tez search: ${ride._id}`);
  }
};

const startScheduledRideJob = () => {
  // Har 2 minute mein pre-bookings dekho
  cron.schedule('*/2 * * * *', async () => {
    try {
      await runScheduledTick();
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  });

  console.log('✅ Scheduled ride cron job started (every 2 min)');

  // Har 15 second mein: progressive radius-dispatch ka agla wave jinki bhi due
  // hai (3km→8km→15km→unlimited) — DB-persisted state (Ride.nextDispatchAt) se
  // chalta hai, isliye server restart/redeploy ke beech mein bhi koi ride
  // "stuck" nahi rehti chhote radius pe hamesha ke liye.
  cron.schedule('*/15 * * * * *', async () => {
    try {
      await dispatchDueRides();
    } catch (err) {
      console.error('dispatchDueRides cron error:', err.message);
    }
  });

  console.log('✅ Ride dispatch-wave cron job started (every 15s)');

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
        // Atomic — isi beech koi driver accept kar le to ride cancel na ho
        const cancelled = await Ride.findOneAndUpdate(
          { _id: ride._id, status: 'searching', provider: null },
          {
            $set: {
              status:             'cancelled',
              cancelledBy:        'admin',
              cancellationReason: 'Koi driver available nahi mila (auto-cancel)',
              cancelledAt:        new Date(),
              nextDispatchAt:     null,
            },
          },
          { new: true },
        );
        if (!cancelled) continue;

        // Ride hui hi nahi — promo wapas. Pehle "pehli ride par chhoot" wala
        // code driver na milne par hi kharch ho jaata tha.
        if (cancelled.promoCode) await releasePromo(cancelled.promoCode, cancelled.customer);

        (cancelled.notifiedDrivers || []).forEach((driverId) => {
          io.to(`driver_${driverId}`).emit('rideNoLongerAvailable', { rideId: String(cancelled._id) });
        });
        io.to(`user_${cancelled.customer}`).emit('rideCancelled', { rideId: cancelled._id, reason: 'Koi driver nahi mila. Dobara try karein.' });
        console.log(`🚫 Auto-cancelled stale ride: ${cancelled._id}`);
      }
    } catch (err) {
      console.error('Auto-cancel cron error:', err.message);
    }
  });

  // Roz IST aadhi raat pe todayEarnings reset karo. timezone ke bina server
  // (UTC) ki aadhi raat lagti thi — yaani subah 5:30 IST, aur raat ki kamai
  // agle din mein gin jaati.
  cron.schedule('0 0 * * *', async () => {
    try {
      await Provider.updateMany({}, { 'stats.todayEarnings': 0 });
      console.log('🔄 todayEarnings reset for all providers');
    } catch (err) {
      console.error('Earnings reset cron error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });
};

module.exports = { startScheduledRideJob };
