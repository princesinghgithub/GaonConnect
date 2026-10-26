// controllers/bannerController.js
// Home screen banners — app ke liye ek read endpoint, admin ke liye CRUD.
const Banner = require('../models/Banner');

// ─── GET /api/banner ─────────────────────────────────────────────────────────
// App yeh call karti hai. Sirf wahi banners jo abhi live hain.
exports.getActiveBanners = async (req, res) => {
  try {
    // Driver app ?audience=driver bhejti hai; kuch na aaye to customer maan lo.
    const audience = req.query.audience === 'driver' ? 'driver' : 'customer';
    const now = new Date();

    const banners = await Banner.find({
      isActive: true,
      audience: { $in: [audience, 'all'] },
      startsAt: { $lte: now },
      // endsAt null ka matlab "khatam nahi hota".
      $or: [{ endsAt: null }, { endsAt: { $gt: now } }],
    })
      .select('title subtitle emoji imageUrl bgColorStart bgColorEnd textColor actionType actionValue')
      .sort({ priority: -1, createdAt: -1 })
      .limit(6)
      .lean();

    // Impressions background mein badhao — response ka intezaar isse na ho.
    if (banners.length) {
      Banner.updateMany(
        { _id: { $in: banners.map((b) => b._id) } },
        { $inc: { impressions: 1 } },
      ).catch(() => {});
    }

    return res.json({ success: true, data: banners });
  } catch (error) {
    console.error('getActiveBanners Error:', error.message);
    return res.status(500).json({ success: false, message: 'Banners laane mein error' });
  }
};

// ─── POST /api/banner/:id/click ──────────────────────────────────────────────
// Tap count. Iske bina pata nahi chalta ki banner kaam kar raha hai ya sirf
// jagah ghere baitha hai.
exports.trackClick = async (req, res) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    return res.json({ success: true });
  } catch {
    // Tracking fail hona user ke liye maayne nahi rakhta.
    return res.json({ success: true });
  }
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

exports.listBanners = async (_req, res) => {
  try {
    const banners = await Banner.find().sort({ priority: -1, createdAt: -1 }).lean();

    const now = new Date();
    return res.json({
      success: true,
      data: banners.map((b) => ({
        ...b,
        // Admin ko ek nazar mein dikhna chahiye ki banner abhi live hai ya
        // nahi — isActive akela kaafi nahi, date window bhi maayne rakhti hai.
        isLive: b.isActive
          && new Date(b.startsAt) <= now
          && (!b.endsAt || new Date(b.endsAt) > now),
        ctr: b.impressions ? Number(((b.clicks / b.impressions) * 100).toFixed(1)) : 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    return res.status(201).json({ success: true, message: 'Banner ban gaya', data: banner });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new:          true,
      runValidators: true,
    });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner nahi mila' });
    return res.json({ success: true, message: 'Banner update ho gaya', data: banner });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner nahi mila' });
    return res.json({ success: true, message: 'Banner hata diya' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
