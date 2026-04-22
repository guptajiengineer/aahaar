const express = require('express');
const router = express.Router();
const {
  getAssignedTasks, getOpenTasks, updateTaskStatus,
  toggleAvailability, getVolunteerProfile, getLeaderboard,
} = require('../controllers/volunteerController');
const { protect } = require('../middleware/authMiddleware');
const { authorise } = require('../middleware/roleMiddleware');
const { uploadListingPhoto } = require('../middleware/uploadMiddleware');

router.use(protect, authorise('volunteer'));

router.get('/profile', getVolunteerProfile);
router.get('/tasks/assigned', getAssignedTasks);
router.get('/tasks/open', getOpenTasks);
router.put('/tasks/:id/status', uploadListingPhoto.single('photo'), updateTaskStatus);
router.put('/availability', toggleAvailability);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
