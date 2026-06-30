const { admin, initialized } = require('./firebaseAdmin');

// ─── Core sender ──────────────────────────────────────────────────────────────

/**
 * Single device ko notification bhejo
 * @param {string} fcmToken  - Device ka FCM token
 * @param {object} payload   - { title, body, data }
 * @returns {boolean}        - true if sent, false if failed/skipped
 */
const sendToDevice = async (fcmToken, { title, body, data = {} }) => {
  if (!initialized || !fcmToken) return false;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'gaonconnect_rides' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });
    return true;
  } catch (err) {
    // Token invalid/expired — log karo but crash mat karo
    if (err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token') {
      console.warn(`⚠️  FCM token invalid (${fcmToken?.slice(0, 20)}...)`);
    } else {
      console.error('FCM send error:', err.message);
    }
    return false;
  }
};

/**
 * Multiple devices ko ek saath notification bhejo
 * @param {string[]} tokens
 * @param {object}   payload
 */
const sendToMultiple = async (tokens, payload) => {
  if (!initialized || !tokens?.length) return;
  const valid = tokens.filter(Boolean);
  if (!valid.length) return;
  await Promise.allSettled(valid.map((t) => sendToDevice(t, payload)));
};

// ─── Ride Notification Templates ─────────────────────────────────────────────

const notify = {

  // Customer ko — driver ne ride accept ki
  rideAccepted: async (customerFcmToken, { driverName, vehicleType, otp }) => {
    return sendToDevice(customerFcmToken, {
      title: '🚗 Driver Mil Gaya!',
      body:  `${driverName} aapki ride accept kar liya. OTP: ${otp}`,
      data:  { type: 'RIDE_ACCEPTED', driverName, vehicleType, otp: String(otp) },
    });
  },

  // Customer ko — driver pickup pe pahunch gaya
  driverArrived: async (customerFcmToken, { driverName }) => {
    return sendToDevice(customerFcmToken, {
      title: '📍 Driver Pahunch Gaya!',
      body:  `${driverName} aapke pickup location pe aa gaya hai.`,
      data:  { type: 'DRIVER_ARRIVED', driverName },
    });
  },

  // Customer ko — ride shuru ho gayi
  rideStarted: async (customerFcmToken, { driverName, destination }) => {
    return sendToDevice(customerFcmToken, {
      title: '🚀 Ride Shuru Ho Gayi!',
      body:  `Aap ${destination} ja rahe hain. Safe journey!`,
      data:  { type: 'RIDE_STARTED', driverName, destination },
    });
  },

  // Customer ko — ride complete
  rideCompleted: async (customerFcmToken, { fare, destination }) => {
    return sendToDevice(customerFcmToken, {
      title: '✅ Ride Complete!',
      body:  `${destination} pahunch gaye. Fare: ₹${fare}. Rating dijiye!`,
      data:  { type: 'RIDE_COMPLETED', fare: String(fare), destination },
    });
  },

  // Customer ko — driver/admin ne cancel kiya
  rideCancelledForCustomer: async (customerFcmToken, { reason }) => {
    return sendToDevice(customerFcmToken, {
      title: '❌ Ride Cancel Ho Gayi',
      body:  reason || 'Aapki ride cancel ho gayi. Dobara try karein.',
      data:  { type: 'RIDE_CANCELLED' },
    });
  },

  // Driver ko — customer ne cancel kiya
  rideCancelledForDriver: async (driverFcmToken, { customerName }) => {
    return sendToDevice(driverFcmToken, {
      title: '❌ Ride Cancel Ho Gayi',
      body:  `${customerName} ne ride cancel kar di.`,
      data:  { type: 'RIDE_CANCELLED' },
    });
  },

  // Driver ko — naya ride request (offline push, socket nahi mila toh backup)
  // `payload` poora ride object hai (rideId, pickup, drop, fare, ...) — JSON
  // string ki tarah data mein jaata hai taaki app tap karne par seedha
  // accept/reject modal khol sake.
  newRideRequest: async (driverFcmToken, payload) => {
    return sendToDevice(driverFcmToken, {
      title: '🔔 Naya Ride Request!',
      body:  `${payload.customerName} — ${payload.pickup?.address || payload.pickup}. Fare: ₹${payload.fare}`,
      data:  { type: 'NEW_RIDE_REQUEST', payload: JSON.stringify(payload) },
    });
  },

  // Driver ko — scheduled ride reminder (15 min pehle). isOnline status
  // ke bina bhi sabhi matching drivers ko jaata hai.
  scheduledRideReminder: async (driverFcmToken, payload) => {
    return sendToDevice(driverFcmToken, {
      title: '⏰ Scheduled Ride Reminder',
      body:  `${payload.customerName} ki ride ${payload.scheduledTime} pe hai. Pickup: ${payload.pickup?.address || payload.pickup}`,
      data:  { type: 'SCHEDULED_RIDE_REMINDER', payload: JSON.stringify(payload) },
    });
  },

  // Driver ko — payment/wallet credit
  walletCredited: async (driverFcmToken, { amount, totalBalance }) => {
    return sendToDevice(driverFcmToken, {
      title: '💰 Payment Mila!',
      body:  `₹${amount} aapke wallet mein aaya. Total: ₹${totalBalance}`,
      data:  { type: 'WALLET_CREDITED', amount: String(amount), totalBalance: String(totalBalance) },
    });
  },

  // Driver ko — account approved
  accountApproved: async (driverFcmToken, { driverName }) => {
    return sendToDevice(driverFcmToken, {
      title: '🎉 Account Approved!',
      body:  `Badhai ho ${driverName}! Aap ab rides le sakte hain.`,
      data:  { type: 'ACCOUNT_APPROVED' },
    });
  },

  // Custom — admin se kisi bhi user/driver ko
  custom: async (fcmToken, { title, body, data }) => {
    return sendToDevice(fcmToken, { title, body, data });
  },

  // Bulk — admin broadcast
  bulk: async (tokens, { title, body, data }) => {
    return sendToMultiple(tokens, { title, body, data });
  },
};

module.exports = { notify, sendToDevice, sendToMultiple };
