const { publicProfile } = require('./authController');

const UPI_REGEX  = /^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// ─── GET /api/saathi/profile ─────────────────────────────────────────────────
const getProfile = async (req, res) => res.json({ success: true, data: publicProfile(req.saathi) });

// ─── PUT /api/saathi/profile ─────────────────────────────────────────────────
// Phone, saathiCode, saathiId aur status jaan-bujhkar yahan se badle nahi ja
// sakte — phone login identity hai aur code par referral tike hote hain.
const updateProfile = async (req, res) => {
  const { name, email, village, district, state, language } = req.body;
  const saathi = req.saathi;

  if (name !== undefined) {
    const clean = String(name).trim();
    if (!clean) return res.status(400).json({ success: false, message: 'Naam khaali nahi ho sakta.' });
    saathi.name = clean;
  }

  if (email !== undefined) {
    const clean = String(email).trim().toLowerCase();
    if (clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return res.status(400).json({ success: false, message: 'Valid email address daalo.' });
    }
    saathi.email = clean || undefined;
  }

  if (village  !== undefined) saathi.village  = String(village).trim();
  if (district !== undefined) saathi.district = String(district).trim();
  if (state    !== undefined) saathi.state    = String(state).trim();

  if (language !== undefined) {
    if (!['hi', 'en'].includes(language)) {
      return res.status(400).json({ success: false, message: "Language 'hi' ya 'en' hi ho sakti hai." });
    }
    saathi.language = language;
  }

  try {
    await saathi.save();
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ye email pehle se kisi aur Saathi ka hai.' });
    }
    throw error;
  }

  return res.json({ success: true, message: 'Profile save ho gayi.', data: publicProfile(saathi) });
};

// ─── PUT /api/saathi/profile/payout ──────────────────────────────────────────
const updatePayout = async (req, res) => {
  const { method, upiId, bank } = req.body;
  const saathi = req.saathi;

  if (method !== undefined) {
    if (!['upi', 'bank'].includes(method)) {
      return res.status(400).json({ success: false, message: "Method 'upi' ya 'bank' hona chahiye." });
    }
    saathi.payout.method = method;
  }

  if (upiId !== undefined) {
    const clean = String(upiId).trim();
    if (clean && !UPI_REGEX.test(clean)) {
      return res.status(400).json({ success: false, message: 'Valid UPI ID daalo (jaise name@upi).' });
    }
    saathi.payout.upiId = clean;
  }

  if (bank !== undefined && bank !== null) {
    const ifsc = String(bank.ifscCode || '').toUpperCase().trim();
    if (ifsc && !IFSC_REGEX.test(ifsc)) {
      return res.status(400).json({ success: false, message: 'Valid IFSC code daalo.' });
    }
    saathi.payout.bank = {
      accountNumber:     String(bank.accountNumber     || '').trim(),
      ifscCode:          ifsc,
      accountHolderName: String(bank.accountHolderName || '').trim(),
      bankName:          String(bank.bankName          || '').trim(),
    };
  }

  // Jo method chuna hai, uski detail adhoori na reh jaaye — warna withdrawal
  // ke waqt hi pata chalta hai, jab Saathi paisa maang raha hota hai.
  if (saathi.payout.method === 'upi' && !saathi.payout.upiId) {
    return res.status(400).json({ success: false, message: 'UPI method ke liye UPI ID zaruri hai.' });
  }
  if (saathi.payout.method === 'bank' && !saathi.payout.bank?.accountNumber) {
    return res.status(400).json({ success: false, message: 'Bank method ke liye account details zaruri hain.' });
  }

  await saathi.save();

  return res.json({ success: true, message: 'Payout details save ho gayi.', data: publicProfile(saathi).payout });
};

module.exports = { getProfile, updateProfile, updatePayout };
