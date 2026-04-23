const express = require('express');
const router = express.Router();
const {
  getVerificationQueue, approveUser, getAllUsers,
  suspendUser, getPlatformStats, sendAnnouncement, getLiveActivity,
  getPendingListings, approveListing, assignListingToNGO, assignListingToVolunteer,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorise } = require('../middleware/roleMiddleware');

router.use(protect, authorise('admin'));

router.get('/verification-queue', getVerificationQueue);
router.put('/users/:id/approve', approveUser);
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.get('/stats', getPlatformStats);
router.post('/announcement', sendAnnouncement);
router.get('/activity', getLiveActivity);

// Listing Approval and Assignment
router.get('/listings/pending', getPendingListings);
router.put('/listings/:id/approve', approveListing);
router.put('/listings/:id/assign-ngo', assignListingToNGO);
router.put('/listings/:id/assign-volunteer', assignListingToVolunteer);

module.exports = router;
