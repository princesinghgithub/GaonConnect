const fs   = require('fs');
const path = require('path');
const { sendEmail } = require('./mailer');

// Embedded once at boot so the receipt renders identically everywhere (in-app
// WebView, downloaded PDF, email) without depending on an external image URL.
const LOGO_BASE64 = fs.readFileSync(
  path.join(__dirname, '../assets/gaonconnect-logo.png')
).toString('base64');

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
    body { font-family: Georgia, 'Times New Roman', serif; background:#eef1ee; padding:24px 16px; color:#2a2a2a; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 28px rgba(20,60,40,0.16); }
    .accent-bar { height:6px; background:linear-gradient(90deg,#F5A623,#e8871a,#F5A623); }
    .header { background:linear-gradient(160deg,#14532d,#1b4332 55%,#2d6a4f); color:#fff; padding:32px 24px 26px; text-align:center; }
    .logo { width:64px; height:64px; border-radius:16px; background:#fff; padding:6px; box-shadow:0 4px 14px rgba(0,0,0,0.25); }
    .header h1 { font-family: Georgia, 'Times New Roman', serif; font-size:24px; letter-spacing:3px; margin-top:14px; font-weight:700; }
    .header p  { font-family: Arial, sans-serif; font-size:12px; opacity:0.8; margin-top:5px; letter-spacing:0.5px; }
    .badge { display:inline-block; background:rgba(245,166,35,0.22); border:1px solid rgba(245,166,35,0.55); color:#ffe4b0; padding:5px 16px; border-radius:20px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:1px; margin-top:14px; }
    .stub { position:relative; height:0; }
    .stub::before { content:''; position:absolute; top:-11px; left:-11px; width:22px; height:22px; background:#eef1ee; border-radius:50%; }
    .stub::after  { content:''; position:absolute; top:-11px; right:-11px; width:22px; height:22px; background:#eef1ee; border-radius:50%; }
    .dashed { border-top:1.5px dashed #d8dcd8; margin:0 24px; }
    .section { padding:22px 24px; }
    .section + .section { border-top:1px solid #f1f1ef; }
    .section-title { font-family: Arial, sans-serif; font-size:11px; font-weight:700; color:#9a9a92; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:14px; }
    .row { display:flex; justify-content:space-between; margin-bottom:9px; font-family: Arial, sans-serif; font-size:14px; }
    .row .label { color:#767670; }
    .row .value { font-weight:700; color:#1f1f1f; }
    .route { background:#f8f9f6; border-radius:10px; padding:16px; border:1px solid #eef0ea; }
    .route .point { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; font-family: Arial, sans-serif; }
    .route .point:last-child { margin-bottom:0; }
    .route .line { width:1px; background:#d8dcd8; margin-left:5px; height:16px; }
    .dot { width:11px; height:11px; border-radius:50%; margin-top:3px; flex-shrink:0; box-shadow:0 0 0 3px rgba(0,0,0,0.04); }
    .dot.green { background:#2d6a4f; }
    .dot.red   { background:#c1440e; }
    .fare-box { background:linear-gradient(160deg,#f8fbf8,#eef7ef); border:1px solid #cfe8d6; border-left:4px solid #2d6a4f; border-radius:10px; padding:18px; font-family: Arial, sans-serif; }
    .fare-total { font-family: Georgia, serif; font-size:26px; font-weight:700; color:#14532d; }
    .promo-line { color:#c1440e; font-size:13px; }
    .tag { display:inline-block; padding:4px 12px; border-radius:12px; font-family: Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.4px; }
    .tag.cash   { background:#fff3cd; color:#8a6404; }
    .tag.online { background:#dce8ff; color:#0b3d91; }
    .tag.wallet { background:#d1ecf1; color:#0c5460; }
    .tag.paid   { background:#dcf3e3; color:#14532d; }
    .footer { background:#f8f9f6; text-align:center; padding:22px 24px; font-family: Arial, sans-serif; }
    .footer .thanks { font-family: Georgia, serif; font-size:15px; color:#1b4332; margin-bottom:6px; }
    .footer p { font-size:12px; color:#9a9a92; }
    .footer a { color:#2d6a4f; text-decoration:none; font-weight:600; }
    .watermark { margin-top:14px; opacity:0.5; }
    .watermark img { width:22px; height:22px; vertical-align:middle; }
  </style>
</head>
<body>
<div class="container">
  <div class="accent-bar"></div>

  <div class="header">
    <img class="logo" src="data:image/png;base64,${LOGO_BASE64}" alt="GaonConnect"/>
    <h1>GAONCONNECT</h1>
    <p>Aapki ride ka receipt</p>
    <div class="badge">INVOICE #${invoiceNo}</div>
  </div>
  <div class="stub"></div>
  <div class="dashed"></div>

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
      <hr style="border:none;border-top:1px dashed #cfe8d6;margin:12px 0"/>
      <div class="row"><span class="label" style="font-size:15px;font-weight:700;color:#1f1f1f">Total Paid</span><span class="fare-total">₹${finalFare}</span></div>
      <div style="margin-top:12px">
        <span class="tag ${paymentMethod}">${paymentMethod.toUpperCase()}</span>
        <span class="tag paid" style="margin-left:6px">${paymentStatus.toUpperCase()}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p class="thanks">Shukriya GaonConnect choose karne ke liye 🙏</p>
    <p>Support: <a href="mailto:support@gaonconnect.in">support@gaonconnect.in</a></p>
    <div class="watermark"><img src="data:image/png;base64,${LOGO_BASE64}" alt=""/></div>
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
  if (!process.env.EMAIL_USER || !process.env.BREVO_API_KEY) return;

  await sendEmail({
    to:      toEmail,
    subject: `GaonConnect Receipt - ${invoiceNo}`,
    html,
  });
};

// ─── Ride se invoice data + HTML build karo (email NAHI bhejta) ──────────────
const buildInvoiceHTML = async (ride) => {
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

    return { invoiceNo, html };
  } catch (err) {
    console.error('Invoice generation error:', err.message);
    return null;
  }
};

// ─── Ride complete hone par ek baar call karo — HTML build + email (agar email ho) ──
const sendInvoice = async (ride) => {
  const result = await buildInvoiceHTML(ride);
  if (!result) return null;

  const email = ride.customer?.email;
  if (email) {
    await sendInvoiceEmail(email, ride.customer.name, result.html, result.invoiceNo).catch(() => {});
  }

  return result;
};

module.exports = { buildInvoiceHTML, sendInvoice, generateInvoiceHTML, generateInvoiceNo };
