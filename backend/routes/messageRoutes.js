const express = require('express');
const router = express.Router();
const { getThread, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:listingId', getThread);
router.post('/:listingId', sendMessage);

module.exports = router;
