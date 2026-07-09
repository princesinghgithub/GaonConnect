const multer = require('multer');
const path   = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder:        'gaonconnect/documents',
    resource_type: 'auto', // PDFs ke liye zaroori, images bhi handle ho jaati hain
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  }),
});

const documentFilter = (_req, file, cb) => {
  const allowedExts  = /\.(jpeg|jpg|png|pdf)$/i;
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  const extOk  = allowedExts.test(path.extname(file.originalname));
  const mimeOk = allowedMimes.includes(file.mimetype);

  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Sirf JPG, PNG ya PDF files allowed hain'));
};

const docUpload = multer({
  storage:    documentStorage,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: documentFilter,
});

module.exports = { docUpload };
