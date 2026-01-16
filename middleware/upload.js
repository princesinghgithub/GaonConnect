// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
const documentsDir = 'uploads/documents/';
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const docType = req.body.documentType || 'document';
    const userId = req.user?.id || 'user';
    cb(null, `${docType}-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const documentFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG/PNG/PDF files are allowed'));
  }
};

const docUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: documentFilter
});

module.exports = { docUpload };