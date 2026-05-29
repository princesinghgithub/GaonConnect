const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { randomUUID } = require('crypto');

// Ensure directory exists at startup
const documentsDir = 'uploads/documents/';
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, documentsDir),
  filename: (_req, file, cb) => {
    // UUID-based name — not guessable from outside
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${randomUUID()}${ext}`);
  },
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
