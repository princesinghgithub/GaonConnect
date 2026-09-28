const incentives = require('../config/incentives');

// ─── GET /api/saathi/referral ────────────────────────────────────────────────
// Code aur dono links. QR portal khud in URLs se banata hai (qrcode.react
// jaisi library se) — backend mein QR image banane ke liye extra dependency
// add karne ki zarurat nahi.
const getReferral = async (req, res) => {
  const code = req.saathi.saathiCode;

  const withRef = (base) => {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}ref=${encodeURIComponent(code)}`;
  };

  return res.json({
    success: true,
    data: {
      saathiCode:  code,
      saathiId:    req.saathi.saathiId,
      driverLink:   withRef(incentives.DRIVER_LINK),
      customerLink: withRef(incentives.CUSTOMER_LINK),
      shareText: {
        driver:   `GaonConnect Driver app par judiye aur kamaiye. Mera Saathi code: ${code}`,
        customer: `GaonConnect se tractor, auto, bike ya cab book kijiye. Mera Saathi code: ${code}`,
      },
      rewards: {
        driverActivation:     incentives.DRIVER_ACTIVATION,
        customerFirstBooking: incentives.CUSTOMER_FIRST_BOOKING,
        milestones:           incentives.MILESTONES,
      },
    },
  });
};

module.exports = { getReferral };
