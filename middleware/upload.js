const multer = require('multer');
const path   = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cloudinary folder me safe-only characters (userId/phone jaisi values folder segment banti hain)
const sanitizeSegment = (value) => String(value || 'misc').replace(/[^a-zA-Z0-9_-]/g, '') || 'misc';

// /register par docUpload.fields() use hota hai — waha alag-alag fieldname se doc-type nikalte hain
// (req.user abhi nahi bana hota, isliye req.body.phone hi identifier hai us waqt)
const REGISTER_FIELD_TO_DOC_TYPE = {
  profilePhoto: 'photo',
  aadhaarPhoto: 'aadhaar',
  licensePhoto: 'license',
  rcPhoto:      'rc',
};

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const ownerId = sanitizeSegment(req.user?.id || req.body?.phone);
    const docType = sanitizeSegment(req.body?.documentType || REGISTER_FIELD_TO_DOC_TYPE[file.fieldname] || file.fieldname);
    const vehicleSegment = req.params?.vehicleId ? `/vehicle-${sanitizeSegment(req.params.vehicleId)}` : '';

    return {
      folder:        `gaonconnect/documents/${ownerId}${vehicleSegment}/${docType}`,
      resource_type: 'auto', // PDFs ke liye zaroori, images bhi handle ho jaati hain
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    };
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

// ─── Photo Upload (Cloudinary, image-only) ────────────────────────────────────
// folderPrefix ke andar har user ki photo apne hi sub-folder me jaati hai (req.user.id se)
const createPhotoUpload = (folderPrefix) => multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: (req) => ({
      folder:          `${folderPrefix}/${sanitizeSegment(req.user?.id)}`,
      resource_type:   'image',
      allowed_formats: ['jpg', 'jpeg', 'png'],
    }),
  }),
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sirf image files allowed hain (JPG/PNG)'));
  },
});

module.exports = { docUpload, createPhotoUpload };
