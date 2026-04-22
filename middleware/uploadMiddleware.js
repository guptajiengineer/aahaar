const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Food photos for listings
const listingPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aahaar/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
  },
});

// Verification documents (IDs, licenses)
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aahaar/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
});

// Profile photos
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aahaar/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, WebP) and PDFs are allowed'), false);
  }
};

const uploadListingPhoto = multer({
  storage: listingPhotoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

module.exports = { uploadListingPhoto, uploadDocument, uploadProfilePhoto };
