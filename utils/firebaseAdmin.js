const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');

let initialized = false;

if (!admin.apps.length) {
  try {
    const sdkPath = process.env.FIREBASE_ADMIN_SDK_PATH;

    if (!sdkPath) {
      console.warn('⚠️  FIREBASE_ADMIN_SDK_PATH not set — push notifications disabled');
    } else {
      const resolvedPath = path.resolve(sdkPath);

      if (!fs.existsSync(resolvedPath)) {
        console.warn(`⚠️  Firebase SDK file not found at: ${resolvedPath} — push notifications disabled`);
      } else {
        const serviceAccount = require(resolvedPath);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        initialized = true;
        console.log('✅ Firebase Admin SDK initialized');
      }
    }
  } catch (err) {
    console.error('❌ Firebase Admin init failed:', err.message);
  }
} else {
  initialized = true;
}

module.exports = { admin, initialized };
