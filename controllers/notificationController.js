const Notification = require('../models/Notification');

// ─── LIST — logged-in user's notifications ───────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = { recipient: req.user.id, recipientType: 'User' };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: { notifications, unreadCount },
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Notifications fetch karne mein error' });
  }
};

// ─── UNREAD COUNT — for the header badge ─────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      recipientType: 'User',
      isRead: false,
    });
    return res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unread count fetch karne mein error' });
  }
};

// ─── MARK ONE AS READ ─────────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true },
    );

    if (!notification) return res.status(404).json({ success: false, message: 'Notification nahi mili' });

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Notification update karne mein error' });
  }
};

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, recipientType: 'User', isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return res.status(200).json({ success: true, message: 'Sab notifications read mark ho gaye' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Notifications update karne mein error' });
  }
};
