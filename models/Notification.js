// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientType',
    required: true
  },
  recipientType: {
    type: String,
    enum: ['User', 'Driver'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'alert', 'promotion'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  data: mongoose.Schema.Types.Mixed // Additional data if needed
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);