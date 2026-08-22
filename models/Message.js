const mongoose = require('mongoose');

// Ride ke dauran customer aur driver ki baat-cheet.
// Call karne pe dono ko ek doosre ka asli number dikhta hai; chat se wo zarurat
// hi kam ho jaati hai. Gaon mein zyadatar log lamba type nahi karte, isliye app
// canned replies bhejti hai — wo bhi normal message hi hote hain.
const MessageSchema = new mongoose.Schema({
  ride: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Ride',
    required: true,
  },

  sender: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // Kis taraf se aaya — UI ko bubble ka rukh tay karne ke liye chahiye,
  // aur sender id se compare karne se sasta hai.
  senderRole: {
    type:     String,
    enum:     ['customer', 'driver'],
    required: true,
  },

  text: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 1000,
  },

  readAt: Date,
}, { timestamps: true });

// Ek ride ke messages waqt ke hisaab se — chat screen yahi query chalati hai.
MessageSchema.index({ ride: 1, createdAt: 1 });

// Chat ride ke saath hi khatam ho jaati hai; 60 din baad messages apne aap
// hat jaate hain taaki collection hamesha badhta na rahe.
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model('Message', MessageSchema);
