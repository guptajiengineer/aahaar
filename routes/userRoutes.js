const express = require('express');
const router = express.Router();
const { getMe, updateMe, uploadProfilePhoto } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePhoto: uploadMiddleware } = require('../middleware/uploadMiddleware');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/photo', protect, uploadMiddleware.single('photo'), uploadProfilePhoto);

module.exports = router;
