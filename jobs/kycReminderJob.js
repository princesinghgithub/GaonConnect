const cron    = require('node-cron');
const Driver  = require('../models/Provider');
const { notify } = require('../utils/notifications');

const startKycReminderJob = () => {
  // Har roz subah 10 AM — pending KYC drivers ko reminder
  cron.schedule('0 10 * * *', async () => {
    try {
      const pendingDrivers = await Driver.find({
        isApproved: false,
        isRejected: false,
        isBlocked:  false,
        'deviceInfo.fcmToken': { $exists: true, $ne: null },
      }).populate('user', 'name');

      if (!pendingDrivers.length) return;

      await Promise.allSettled(
        pendingDrivers.map(driver =>
          notify.kycReminder(driver.deviceInfo.fcmToken, {
            driverName: driver.user?.name || 'Driver',
          })
        )
      );

      console.log(`✅ KYC reminder bheja: ${pendingDrivers.length} drivers ko`);
    } catch (err) {
      console.error('KYC reminder job error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('📋 KYC reminder job started (daily 10 AM IST)');
};

module.exports = { startKycReminderJob };
