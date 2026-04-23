const express = require('express');
const router = express.Router();
const {
  getNearbyListings, claimListing, assignVolunteer,
  getMyCollections, getLinkedVolunteers,
  logDistribution, getNGOStats,
  searchVolunteers, addVolunteerToNGO, removeVolunteerFromNGO,
} = require('../controllers/ngoController');
const { protect } = require('../middleware/authMiddleware');
const { authorise } = require('../middleware/roleMiddleware');

router.use(protect, authorise('ngo'));

router.get('/stats', getNGOStats);
router.get('/listings/nearby', getNearbyListings);
router.put('/listings/:id/claim', claimListing);
router.put('/listings/:id/assign-volunteer', assignVolunteer);
router.get('/collections', getMyCollections);
router.get('/distribution-log', (req, res) => res.json({ success: true, logs: [] })); // placeholder
router.post('/distribution-log', logDistribution);

// Volunteer management
router.get('/volunteers/search', searchVolunteers);
router.get('/volunteers', getLinkedVolunteers);
router.post('/volunteers/add', addVolunteerToNGO);
router.delete('/volunteers/:volunteerId', removeVolunteerFromNGO);

module.exports = router;

