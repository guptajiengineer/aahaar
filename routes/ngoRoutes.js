const express = require('express');
const router = express.Router();
const {
  getNearbyListings, claimListing, assignVolunteer,
  getMyCollections, getLinkedVolunteers,
  logDistribution, getNGOStats,
} = require('../controllers/ngoController');
const { protect } = require('../middleware/authMiddleware');
const { authorise } = require('../middleware/roleMiddleware');

router.use(protect, authorise('ngo'));

router.get('/stats', getNGOStats);
router.get('/listings/nearby', getNearbyListings);
router.put('/listings/:id/claim', claimListing);
router.put('/listings/:id/assign-volunteer', assignVolunteer);
router.get('/collections', getMyCollections);
router.get('/volunteers', getLinkedVolunteers);
router.post('/distribution-log', logDistribution);

module.exports = router;
