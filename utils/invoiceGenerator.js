const nodemailer = require('nodemailer');

// ─── HTML Invoice Template ────────────────────────────────────────────────────
const generateInvoiceHTML = (data) => {
  const {
    invoiceNo, rideId, date,
    customer, driver, vehicle,
    pickup, drop,
    distance, duration,
    fare, commission, driverEarning,
    paymentMethod, paymentStatus,
    promoDiscount = 0,
  } = data;

  const finalFare = fare - (promoDiscount || 0);

  return `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>GaonConnect Receipt</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background:#f4f4f4; padding:20px; color:#333; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.1); }
    .header { background:linear-gradient(135deg,#2d6a4f,#40916c); color:#fff; padding:28px 24px; text-align:center; }
    .header h1 { font-size:26px; letter-spacing:1px; }
    .header p  { font-size:13px; opacity:0.85; margin-top:4px; }
    .badge { display:inline-block; background:rgba(255,255,255,0.2); padding:4px 14px; border-radius:20px; font-size:12px; margin-top:10px; }
    .section { padding:20px 24px; border-bottom:1px solid #eee; }
    .section:last-child { border-bottom:none; }
    .section-title { font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
    .row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; }
    .row .label { color:#666; }
    .row .value { font-weight:600; color:#222; }
    .route { background:#f9f9f9; border-radius:8px; padding:14px; }
    .route .point { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }
    .route .point:last-child { margin-bottom:0; }
    .dot { width:12px; height:12px; border-radius:50%; margin-top:3px; flex-shrink:0; }
    .dot.green { background:#2d6a4f; }
    .dot.red   { background:#e63946; }
    .fare-box { background:#f0fdf4; border:1px solid #b7e4c7; border-radius:8px; padding:16px; }
    .fare-total { font-size:22px; font-weight:700; color:#2d6a4f; }
    .promo-line { color:#e63946; font-size:13px; }
    .tag { display:inline-block; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600; }
    .tag.cash   { background:#fff3cd; color:#856404; }
    .tag.online { background:#cfe2ff; color:#084298; }
    .tag.wallet { background:#d1ecf1; color:#0c5460; }
    .tag.paid   { background:#d4edda; color:#155724; }
    .footer { background:#f8f9fa; text-align:center; padding:16px; font-size:12px; color:#888; }
    .footer a { color:#2d6a4f; text-decoration:none; }
  </style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>🌿 GaonConnect</h1>
    <p>Aapki ride ka receipt</p>
    <span class="badge">Invoice #${invoiceNo}</span>
  </div>

  <div class="section">
    <div class="section-title">Ride Details</div>
    <div class="row"><span class="label">Ride ID</span><span class="value">${String(rideId).slice(-8).toUpperCase()}</span></div>
    <div class="row"><span class="label">Date & Time</span><span class="value">${date}</span></div>
    <div class="row"><span class="label">Vehicle</span><span class="value">${vehicle}</span></div>
    <div class="row"><span class="label">Distance</span><span class="value">${distance} km</span></div>
    <div class="row"><span class="label">Duration</span><span class="value">${duration} min</span></div>
  </div>

  <div class="section">
    <div class="section-title">Route</div>
    <div class="route">
      <div class="point">
        <div class="dot green"></div>
        <div><strong>Pickup</strong><br/><span style="font-size:13px;color:#555">${pickup}</span></div>
      </div>
      <div class="point">
        <div class="dot red"></div>
        <div><strong>Drop</strong><br/><span style="font-size:13px;color:#555">${drop}</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Passenger & Driver</div>
    <div class="row"><span class="label">Passenger</span><span class="value">${customer.name}</span></div>
    <div class="row"><span class="label">Phone</span><span class="value">${customer.phone}</span></div>
    <div class="row"><span class="label">Driver</span><span class="value">${driver.name}</span></div>
    <div class="row"><span class="label">Driver Phone</span><span class="value">${driver.phone}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Payment</div>
    <div class="fare-box">
      <div class="row"><span class="label">Base Fare</span><span class="value">₹${fare}</span></div>
      ${promoDiscount > 0 ? `<div class="row promo-line"><span class="label">🎉 Promo Discount</span><span class="value">- ₹${promoDiscount}</span></div>` : ''}
      <hr style="border:none;border-top:1px dashed #ccc;margin:10px 0"/>
      <div class="row"><span class="label" style="font-size:15px;font-weight:700">Total Paid</span><span class="fare-total">₹${finalFare}</span></div>
      <div style="margin-top:10px">
        <span class="tag ${paymentMethod}">${paymentMethod.toUpperCase()}</span>
        <span class="tag paid" style="margin-left:6px">${paymentStatus.toUpperCase()}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Shukriya GaonConnect choose karne ke liye! 🙏</p>
    <p style="margin-top:6px">Support: <a href="mailto:support@gaonconnect.in">support@gaonconnect.in</a></p>
  </div>

</div>
</body>
</html>`;
};

// ─── Invoice Number Generate ──────────────────────────────────────────────────
const generateInvoiceNo = (rideId) => {
  const ts   = Date.now().toString(36).toUpperCase();
  const tail = String(rideId).slice(-4).toUpperCase();
  return `GC-${ts}-${tail}`;
};

// ─── Email bhejo ──────────────────────────────────────────────────────────────
const sendInvoiceEmail = async (toEmail, customerName, html, invoiceNo) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from:    `"GaonConnect" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: `GaonConnect Receipt - ${invoiceNo}`,
    html,
  });
};

// ─── Main: Ride se invoice data build karo ────────────────────────────────────
const buildAndSendInvoice = async (ride) => {
  try {
    const invoiceNo    = generateInvoiceNo(ride._id);
    const commission   = Math.round(ride.fare * 0.15);
    const driverEarning = ride.fare - commission;

    const dateStr = new Date(ride.completedAt || ride.updatedAt).toLocaleString('hi-IN', {
      timeZone:     'Asia/Kolkata',
      day:          '2-digit',
      month:        'short',
      year:         'numeric',
      hour:         '2-digit',
      minute:       '2-digit',
    });

    const html = generateInvoiceHTML({
      invoiceNo,
      rideId:       ride._id,
      date:         dateStr,
      customer: {
        name:  ride.customer?.name  || 'Customer',
        phone: ride.customer?.phone || '',
      },
      driver: {
        name:  ride.provider?.user?.name  || 'Driver',
        phone: ride.provider?.user?.phone || '',
      },
      vehicle:       ride.vehicleType,
      pickup:        ride.pickup?.address  || '',
      drop:          ride.drop?.address    || '',
      distance:      ride.distance         || 0,
      duration:      ride.actualDuration   || ride.estimatedDuration || 0,
      fare:          ride.fare             || 0,
      commission,
      driverEarning,
      paymentMethod: ride.paymentMethod    || 'cash',
      paymentStatus: ride.paymentStatus    || 'paid',
    });

    // Email bhejo agar customer ka email ho
    const email = ride.customer?.email;
    if (email) {
      await sendInvoiceEmail(email, ride.customer.name, html, invoiceNo).catch(() => {});
    }

    return { invoiceNo, html };
  } catch (err) {
    console.error('Invoice generation error:', err.message);
    return null;
  }
};

module.exports = { buildAndSendInvoice, generateInvoiceHTML, generateInvoiceNo };
