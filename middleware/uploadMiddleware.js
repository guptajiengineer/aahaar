const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { isCloudinaryConfigured } = require('../config/cloudinary');

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, WebP) and PDFs are allowed'), false);
  }
};

// Fallback when Cloudinary is not configured — files are held in memory
// Controllers use req.file?.path || null so no crash occurs
const memoryFallback = multer.memoryStorage();

const buildUploader = (cloudinaryParams, sizeLimit) => {
  if (isCloudinaryConfigured) {
    return multer({
      storage: new CloudinaryStorage({ cloudinary, params: cloudinaryParams }),
      fileFilter,
      limits: { fileSize: sizeLimit },
    });
  }
  console.warn('[Upload] Cloudinary not configured — using memory fallback. Files will NOT be persisted.');
  return multer({ storage: memoryFallback, fileFilter, limits: { fileSize: sizeLimit } });
};

// Food photos for listings
const uploadListingPhoto = buildUploader(
  {
    folder: 'aahaar/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
  },
  5 * 1024 * 1024 // 5 MB
);

// Verification documents (IDs, licenses)
const uploadDocument = buildUploader(
  {
    folder: 'aahaar/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
  10 * 1024 * 1024 // 10 MB
);

// Profile photos
const uploadProfilePhoto = buildUploader(
  {
    folder: 'aahaar/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
  3 * 1024 * 1024 // 3 MB
);

module.exports = { uploadListingPhoto, uploadDocument, uploadProfilePhoto };

