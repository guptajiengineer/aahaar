const asyncHandler = require('express-async-handler');
const Listing = require('../models/Listing');
const DonorProfile = require('../models/DonorProfile');
const { calculateMeals } = require('../utils/calculateImpact');

// @desc    Create a new donation listing
// @route   POST /api/donor/listings
// @access  Private (donor)
const createListing = asyncHandler(async (req, res) => {
  const {
    foodName, quantity, unit, foodType, description,
    pickupWindowStart, pickupWindowEnd, address,
    latitude, longitude,
  } = req.body;

  const estimatedMeals = calculateMeals(Number(quantity), unit);

  const listing = await Listing.create({
    donorId: req.user._id,
    foodName,
    quantity: Number(quantity),
    unit,
    foodType,
    description,
    photo: req.file ? req.file.path : null,
    pickupWindowStart,
    pickupWindowEnd,
    address,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    estimatedMeals,
  });

  // Update donor's total donation count
  await DonorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $inc: { totalDonations: 1, totalMealsEstimate: estimatedMeals } }
  );

  res.status(201).json({ success: true, listing });
});

// @desc    Get all listings created by the logged-in donor
// @route   GET /api/donor/listings
// @access  Private (donor)
const getMyListings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { donorId: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [listings, total] = await Promise.all([
    Listing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('claimedBy', 'name')
      .populate('assignedVolunteer', 'name'),
    Listing.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    listings,
  });
});

// @desc    Get a single listing by ID
// @route   GET /api/donor/listings/:id
// @access  Private (donor)
const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    donorId: req.user._id,
  })
    .populate('claimedBy', 'name email phone')
    .populate('assignedVolunteer', 'name phone');

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  res.json({ success: true, listing });
});

// @desc    Update a listing (only if still active)
// @route   PUT /api/donor/listings/:id
// @access  Private (donor)
const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    donorId: req.user._id,
  });

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (listing.status !== 'active') {
    res.status(400);
    throw new Error('Only active listings can be edited');
  }

  const allowedFields = [
    'foodName', 'quantity', 'unit', 'foodType',
    'description', 'pickupWindowStart', 'pickupWindowEnd', 'address',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) listing[field] = req.body[field];
  });

  if (req.file) listing.photo = req.file.path;

  if (req.body.quantity || req.body.unit) {
    listing.estimatedMeals = calculateMeals(
      Number(listing.quantity),
      listing.unit
    );
  }

  await listing.save();
  res.json({ success: true, listing });
});

// @desc    Close (cancel) a listing
// @route   PUT /api/donor/listings/:id/close
// @access  Private (donor)
const closeListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    donorId: req.user._id,
  });

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (['collected', 'delivered'].includes(listing.status)) {
    res.status(400);
    throw new Error('Cannot close a listing that is already being processed');
  }

  listing.status = 'closed';
  await listing.save();

  res.json({ success: true, message: 'Listing closed', listing });
});

// @desc    Get donor impact stats
// @route   GET /api/donor/stats
// @access  Private (donor)
const getDonorStats = asyncHandler(async (req, res) => {
  const profile = await DonorProfile.findOne({ userId: req.user._id });

  const statusCounts = await Listing.aggregate([
    { $match: { donorId: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  statusCounts.forEach((s) => { countMap[s._id] = s.count; });

  res.json({
    success: true,
    stats: {
      totalDonations: profile?.totalDonations || 0,
      totalMealsEstimate: profile?.totalMealsEstimate || 0,
      active: countMap['active'] || 0,
      claimed: countMap['claimed'] || 0,
      delivered: countMap['delivered'] || 0,
      closed: countMap['closed'] || 0,
    },
  });
});

module.exports = {
  createListing,
  getMyListings,
  getListingById,
  updateListing,
  closeListing,
  getDonorStats,
};
