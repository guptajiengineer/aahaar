const express = require('express');
const router = express.Router();
const {
  getVerificationQueue, approveUser, getAllUsers,
  suspendUser, getPlatformStats, sendAnnouncement, getLiveActivity,
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

module.exports = router;
