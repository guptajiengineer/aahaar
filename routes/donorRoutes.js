const express = require('express');
const router = express.Router();
const {
  createListing, getMyListings, getListingById,
  updateListing, closeListing, getDonorStats,
} = require('../controllers/donorController');
const { protect } = require('../middleware/authMiddleware');
const { authorise } = require('../middleware/roleMiddleware');
const { uploadListingPhoto } = require('../middleware/uploadMiddleware');

router.use(protect, authorise('donor'));

router.get('/stats', getDonorStats);
router.get('/listings', getMyListings);
router.post('/listings', uploadListingPhoto.single('photo'), createListing);
router.get('/listings/:id', getListingById);
router.put('/listings/:id', uploadListingPhoto.single('photo'), updateListing);
router.put('/listings/:id/close', closeListing);

module.exports = router;
