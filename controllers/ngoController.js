const asyncHandler = require('express-async-handler');
const Listing = require('../models/Listing');
const Task = require('../models/Task');
const NGOProfile = require('../models/NGOProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const User = require('../models/User');
const DistributionLog = require('../models/DistributionLog');
const { createNotification } = require('../utils/createNotification');

// @desc    Get nearby active listings within a radius
// @route   GET /api/ngo/listings/nearby
// @access  Private (ngo)
const getNearbyListings = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, foodType, minQuantity } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const query = {
    status: 'active',
    isApproved: true,
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000, // convert km to metres
      },
    },
  };

  if (foodType) query.foodType = foodType;
  if (minQuantity) query.quantity = { $gte: Number(minQuantity) };

  const listings = await Listing.find(query)
    .limit(50)
    .populate('donorId', 'name phone city');

  res.json({ success: true, count: listings.length, listings });
});

// @desc    Claim a listing
// @route   PUT /api/ngo/listings/:id/claim
// @access  Private (ngo)
const claimListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('donorId', 'name');

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (listing.status !== 'active') {
    res.status(400);
    throw new Error('This listing is no longer available');
  }

  listing.status = 'claimed';
  listing.claimedBy = req.user._id;
  listing.claimedAt = Date.now();
  await listing.save();

  // Notify the donor
  await createNotification(
    listing.donorId._id,
    `Your donation "${listing.foodName}" has been claimed by an NGO and is being arranged for pickup.`,
    'listing_claimed',
    listing._id,
    'Listing'
  );

  res.json({ success: true, message: 'Listing claimed successfully', listing });
});

// @desc    Assign a volunteer to a claimed listing
// @route   PUT /api/ngo/listings/:id/assign-volunteer
// @access  Private (ngo)
const assignVolunteer = asyncHandler(async (req, res) => {
  const { volunteerId } = req.body;
  const listing = await Listing.findOne({
    _id: req.params.id,
    claimedBy: req.user._id,
  });

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found or not claimed by your organisation');
  }

  if (!['claimed', 'active'].includes(listing.status)) {
    res.status(400);
    throw new Error('Volunteer can only be assigned to claimed listings');
  }

  // Check if volunteer belongs to this NGO
  const ngoProfile = await NGOProfile.findOne({ userId: req.user._id });
  if (!ngoProfile.assignedVolunteers.includes(volunteerId)) {
    res.status(403);
    throw new Error('This volunteer is not part of your organisation');
  }

  listing.assignedVolunteer = volunteerId;
  await listing.save();

  // Create a task
  const task = await Task.create({
    listingId: listing._id,
    volunteerId,
    ngoId: req.user._id,
    status: 'assigned',
  });

  // Notify volunteer
  await createNotification(
    volunteerId,
    `You have been assigned a new pickup task for "${listing.foodName}". Check your task feed.`,
    'listing_assigned',
    listing._id,
    'Listing'
  );

  res.json({ success: true, task, listing });
});

// @desc    Get NGO's collections (claimed/active/delivered)
// @route   GET /api/ngo/collections
// @access  Private (ngo)
const getMyCollections = asyncHandler(async (req, res) => {
  const { tab = 'active' } = req.query;

  const statusMap = {
    active: ['claimed'],
    in_progress: ['collected'],
    completed: ['delivered'],
  };

  const statuses = statusMap[tab] || ['claimed'];

  const listings = await Listing.find({
    claimedBy: req.user._id,
    status: { $in: statuses },
  })
    .sort({ claimedAt: -1 })
    .populate('donorId', 'name phone address')
    .populate('assignedVolunteer', 'name phone');

  res.json({ success: true, listings });
});

// @desc    Get volunteers linked to this NGO
// @route   GET /api/ngo/volunteers
// @access  Private (ngo)
const getLinkedVolunteers = asyncHandler(async (req, res) => {
  const ngoProfile = await NGOProfile.findOne({ userId: req.user._id }).populate(
    'assignedVolunteers',
    'name email phone city isVerified'
  );

  res.json({ success: true, volunteers: ngoProfile?.assignedVolunteers || [] });
});

// @desc    Log a distribution event
// @route   POST /api/ngo/distribution-log
// @access  Private (ngo)
const logDistribution = asyncHandler(async (req, res) => {
  const { listingId, beneficiariesCount, distributionLocation, notes } = req.body;

  const listing = await Listing.findOne({
    _id: listingId,
    claimedBy: req.user._id,
  });

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const log = await DistributionLog.create({
    ngoId: req.user._id,
    listingId,
    beneficiariesCount: Number(beneficiariesCount),
    distributionLocation,
    notes,
  });

  // Update NGO meals served
  const NGOProfile = require('../models/NGOProfile');
  await NGOProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $inc: { totalMealsServed: Number(beneficiariesCount) } }
  );

  res.status(201).json({ success: true, log });
});

// @desc    Get NGO stats
// @route   GET /api/ngo/stats
// @access  Private (ngo)
const getNGOStats = asyncHandler(async (req, res) => {
  const profile = await NGOProfile.findOne({ userId: req.user._id });

  const collectionCounts = await Listing.aggregate([
    { $match: { claimedBy: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  collectionCounts.forEach((s) => { countMap[s._id] = s.count; });

  res.json({
    success: true,
    stats: {
      totalMealsServed: profile?.totalMealsServed || 0,
      totalCollections: Object.values(countMap).reduce((a, b) => a + b, 0),
      active: countMap['claimed'] || 0,
      completed: countMap['delivered'] || 0,
      volunteerCount: profile?.assignedVolunteers?.length || 0,
    },
  });
});

// @desc    Search all approved volunteers (for NGO to recruit)
// @route   GET /api/ngo/volunteers/search?q=name
// @access  Private (ngo)
const searchVolunteers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  const query = { role: 'volunteer', isApproved: true, isSuspended: false };
  if (q && q.trim()) {
    query.$or = [
      { name: { $regex: q.trim(), $options: 'i' } },
      { city: { $regex: q.trim(), $options: 'i' } },
    ];
  }

  const volunteers = await User.find(query).select('name email city profilePhoto').limit(20);
  res.json({ success: true, volunteers });
});

// @desc    Add a volunteer to this NGO's team
// @route   POST /api/ngo/volunteers/add
// @access  Private (ngo)
const addVolunteerToNGO = asyncHandler(async (req, res) => {
  const { volunteerId } = req.body;

  const volunteer = await User.findOne({
    _id: volunteerId,
    role: 'volunteer',
    isApproved: true,
    isSuspended: false,
  });

  if (!volunteer) {
    res.status(404);
    throw new Error('Volunteer not found or not approved');
  }

  // Add to NGO's assignedVolunteers (avoid duplicates with $addToSet)
  await NGOProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $addToSet: { assignedVolunteers: volunteerId } }
  );

  // Set volunteer's linkedNGO
  await VolunteerProfile.findOneAndUpdate(
    { userId: volunteerId },
    { linkedNGO: req.user._id }
  );

  // Notify the volunteer
  await createNotification(
    volunteerId,
    `You have been added to ${req.user.name}'s team on Aahaar. You will now receive pickup tasks from them.`,
    'general'
  );

  res.json({ success: true, message: 'Volunteer added to your team' });
});

// @desc    Remove a volunteer from this NGO's team
// @route   DELETE /api/ngo/volunteers/:volunteerId
// @access  Private (ngo)
const removeVolunteerFromNGO = asyncHandler(async (req, res) => {
  const { volunteerId } = req.params;

  await NGOProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $pull: { assignedVolunteers: volunteerId } }
  );

  // Only clear linkedNGO if they were linked to THIS ngo
  await VolunteerProfile.findOneAndUpdate(
    { userId: volunteerId, linkedNGO: req.user._id },
    { linkedNGO: null }
  );

  res.json({ success: true, message: 'Volunteer removed from your team' });
});

module.exports = {
  getNearbyListings,
  claimListing,
  assignVolunteer,
  getMyCollections,
  getLinkedVolunteers,
  logDistribution,
  getNGOStats,
  searchVolunteers,
  addVolunteerToNGO,
  removeVolunteerFromNGO,
};
