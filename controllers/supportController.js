// controllers/supportController.js
// App ke andar se complaint / lost item report karna.
//
// Complaint model aur uske routes pehle se the — par sirf /api/admin ke neeche.
// Matlab user khud kuch report nahi kar sakta tha; help screen mein bas phone,
// WhatsApp aur email ke link the. Uske saath do dikkatein thi: complaint kisi
// ride se judi hi nahi hoti, aur user ko kabhi pata nahi chalta ki uske
// message ka kya hua. Yahan dono theek ho jaate hain.
const Complaint = require('../models/Complaint');
const Ride      = require('../models/Ride');
const Provider  = require('../models/Provider');

const VALID_CATEGORIES = [
  'fare', 'behavior', 'safety', 'vehicle_condition',
  'delay', 'route', 'lost_item', 'other',
];

// Safety aur lost item ka intezaar nahi karwaya jaata — inhe admin queue mein
// upar aana chahiye.
const priorityFor = (category) => {
  if (category === 'safety')    return 'urgent';
  if (category === 'lost_item') return 'high';
  if (category === 'fare')      return 'medium';
  return 'medium';
};

/**
 * POST /api/support/complaint
 * body: { rideId?, category, description }
 */
exports.createComplaint = async (req, res) => {
  try {
    const { rideId, category = 'other', description } = req.body;

    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Problem likhna zaroori hai' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Category sahi nahi hai' });
    }

    const doc = {
      complainant:      req.user.id,
      complainantName:  req.user.name  || '',
      complainantPhone: req.user.phone || '',
      category,
      description:      String(description).trim().slice(0, 2000),
      priority:         priorityFor(category),
      type:             req.activeRole === 'provider' ? 'driver_vs_customer' : 'customer_vs_driver',
    };

    // Ride optional hai (app_issue jaisi shikayat kisi ride se judi nahi hoti),
    // par agar di gayi hai to yeh pakka karo ki wo isi user ki ride hai —
    // warna koi bhi kisi aur ki ride pe complaint khol sakta hai.
    if (rideId) {
      const ride = await Ride.findById(rideId).select('customer provider');
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride nahi mili' });
      }

      const isCustomer = ride.customer?.toString() === req.user.id;
      let isDriver = false;
      if (ride.provider) {
        const provider = await Provider.findById(ride.provider).select('user');
        isDriver = provider?.user?.toString() === req.user.id;
      }

      if (!isCustomer && !isDriver) {
        return res.status(403).json({ success: false, message: 'Yeh ride aapki nahi hai' });
      }

      doc.ride = ride._id;

      // Shikayat kiske khilaf hai — dusra paksh.
      if (isCustomer && ride.provider) {
        const provider = await Provider.findById(ride.provider).populate('user', 'name');
        if (provider?.user) {
          doc.against     = provider.user._id;
          doc.againstName = provider.user.name || '';
        }
      } else if (isDriver) {
        doc.against = ride.customer;
      }
    }

    const complaint = await Complaint.create(doc);

    return res.status(201).json({
      success: true,
      message: 'Aapki shikayat darj ho gayi. Hum jald sampark karenge.',
      data:    complaint,
    });
  } catch (error) {
    console.error('createComplaint Error:', error.message);
    return res.status(500).json({ success: false, message: 'Shikayat darj karne mein error' });
  }
};

/**
 * GET /api/support/complaints
 * User apni hi shikayatein aur unka status dekh sake.
 */
exports.myComplaints = async (req, res) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const query = { complainant: req.user.id };

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .select('category description status priority resolution ride createdAt resolvedAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Complaint.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        complaints,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total },
      },
    });
  } catch (error) {
    console.error('myComplaints Error:', error.message);
    return res.status(500).json({ success: false, message: 'Shikayatein laane mein error' });
  }
};
