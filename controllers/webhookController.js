const crypto = require('crypto');
const Ride   = require('../models/Ride');
const { getIO } = require('../socket');

// ─── RAZORPAY WEBHOOK ──────────────────────────────────────────────────────────
// Razorpay dashboard se seedha server-to-server call aata hai (payment.captured /
// payment.failed) — client-side verify (razorpay-verify) ke miss ho jaane ka
// (app band ho gaya, network gaya) backup / source of truth yehi hai.
// Route raw body (Buffer) pe mount hai — signature isi raw bytes se banti hai.
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET .env mein nahi hai');
      return res.status(500).json({ success: false });
    }

    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body) // raw Buffer — express.raw() se aata hai
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = signature ? Buffer.from(String(signature), 'utf8') : null;
    const isValid = !!receivedBuf
      && receivedBuf.length === expectedBuf.length
      && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      console.error('Razorpay webhook: invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));

    if (event.event === 'payment.captured' || event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (!orderId) return res.status(200).json({ success: true }); // acknowledge, kuch karne layak nahi

      const ride = await Ride.findOne({ razorpayOrderId: orderId });
      if (ride) {
        ride.paymentStatus = event.event === 'payment.captured' ? 'paid' : 'failed';
        if (event.event === 'payment.captured') ride.razorpayPaymentId = payment.id;
        await ride.save();
        console.log(`Razorpay webhook: ride ${ride._id} → ${ride.paymentStatus}`);
      }
    }

    // Cash ride ka QR scan karke payment — driver app payment-collection flow
    if (event.event === 'qr_code.credited') {
      const qrCode = event.payload?.qr_code?.entity;
      const payment = event.payload?.payment?.entity;
      const qrCodeId = qrCode?.id;
      if (!qrCodeId) return res.status(200).json({ success: true });

      const ride = await Ride.findOne({ razorpayQrCodeId: qrCodeId });
      if (ride) {
        ride.paymentStatus = 'paid';
        if (payment?.id) ride.razorpayPaymentId = payment.id;
        await ride.save();
        console.log(`Razorpay webhook: ride ${ride._id} QR paid`);

        // Driver aur customer dono ko turant push — 3s polling ka wait nahi karna padta
        // (Rapido jaisa instant feel). DB save ho chuka hai — socket push fail bhi ho to
        // webhook ko fail nahi dikhana (Razorpay warna isi payment ko baar-baar retry
        // karega jabki wo already successfully process ho chuki hai)
        try {
          if (ride.provider) {
            getIO().to(`driver_${ride.provider}`).emit('paymentReceived', {
              rideId: ride._id.toString(),
            });
          }
          if (ride.customer) {
            getIO().to(`user_${ride.customer}`).emit('paymentConfirmed', {
              rideId: ride._id.toString(),
            });
          }
        } catch (socketErr) {
          console.error('Razorpay webhook: socket push failed (non-fatal):', socketErr.message);
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return res.status(500).json({ success: false });
  }
};
