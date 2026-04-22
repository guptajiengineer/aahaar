const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Listing = require('../models/Listing');
const VolunteerProfile = require('../models/VolunteerProfile');
const { createNotification } = require('../utils/createNotification');

const POINTS_PER_DELIVERY = 10;

const BADGE_THRESHOLDS = [
  { deliveries: 1,  name: 'First Meal',     icon: '🌱' },
  { deliveries: 5,  name: 'Rising Star',    icon: '⭐' },
  { deliveries: 10, name: 'Dedicated',      icon: '🏅' },
  { deliveries: 25, name: 'Community Hero', icon: '🦸' },
  { deliveries: 50, name: 'Food Champion',  icon: '🏆' },
];

// @desc    Get tasks assigned to this volunteer
// @route   GET /api/volunteer/tasks/assigned
// @access  Private (volunteer)
const getAssignedTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ volunteerId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'listingId',
      populate: { path: 'donorId', select: 'name phone address' },
    })
    .populate('ngoId', 'name phone');

  res.json({ success: true, tasks });
});

// @desc    Get open/nearby tasks (not yet assigned by NGO, just active listings near volunteer)
// @route   GET /api/volunteer/tasks/open
// @access  Private (volunteer)
const getOpenTasks = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 15 } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Location is required to find open tasks');
  }

  const listings = await Listing.find({
    status: 'active',
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000,
      },
    },
  })
    .limit(20)
    .populate('donorId', 'name phone');

  res.json({ success: true, listings });
});

// @desc    Update task status (in-progress → collected → delivered)
// @route   PUT /api/volunteer/tasks/:id/status
// @access  Private (volunteer)
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validTransitions = {
    assigned: 'in-progress',
    'in-progress': 'collected',
    collected: 'delivered',
  };

  const task = await Task.findOne({ _id: req.params.id, volunteerId: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (validTransitions[task.status] !== status) {
    res.status(400);
    throw new Error(`Cannot move task from "${task.status}" to "${status}"`);
  }

  // Require photo for collected and delivered steps
  if ((status === 'collected' || status === 'delivered') && !req.file) {
    res.status(400);
    throw new Error(`Please upload a photo proof for the "${status}" step`);
  }

  if (status === 'collected') {
    task.pickupPhoto = req.file.path;
    // Update listing status
    await Listing.findByIdAndUpdate(task.listingId, { status: 'collected' });
  }

  if (status === 'delivered') {
    task.deliveryPhoto = req.file.path;
    task.completedAt = Date.now();
    await Listing.findByIdAndUpdate(task.listingId, { status: 'delivered' });

    // Award points
    const profile = await VolunteerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalDeliveries: 1, points: POINTS_PER_DELIVERY } },
      { new: true }
    );

    // Check for new badges
    const newBadges = BADGE_THRESHOLDS.filter(
      (b) =>
        b.deliveries === profile.totalDeliveries &&
        !profile.badges.find((pb) => pb.name === b.name)
    );

    if (newBadges.length) {
      profile.badges.push(...newBadges.map((b) => ({ name: b.name, icon: b.icon })));
      await profile.save();

      await createNotification(
        req.user._id,
        `You earned a new badge: ${newBadges.map((b) => b.name).join(', ')} 🎉`,
        'general'
      );
    }

    // Notify NGO
    await createNotification(
      task.ngoId,
      `Task for listing has been delivered by ${req.user.name}. Please log the distribution.`,
      'task_update',
      task._id,
      'Task'
    );
  }

  task.status = status;
  await task.save();

  res.json({ success: true, task });
});

// @desc    Toggle volunteer availability
// @route   PUT /api/volunteer/availability
// @access  Private (volunteer)
const toggleAvailability = asyncHandler(async (req, res) => {
  const profile = await VolunteerProfile.findOne({ userId: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error('Volunteer profile not found');
  }

  profile.availability = !profile.availability;
  await profile.save();

  res.json({
    success: true,
    availability: profile.availability,
    message: profile.availability ? 'You are now available for tasks' : 'You are now marked as unavailable',
  });
});

// @desc    Get volunteer's profile, points, badges, leaderboard position
// @route   GET /api/volunteer/profile
// @access  Private (volunteer)
const getVolunteerProfile = asyncHandler(async (req, res) => {
  const profile = await VolunteerProfile.findOne({ userId: req.user._id })
    .populate('linkedNGO', 'name');

  // Get leaderboard position
  const higherRanked = await VolunteerProfile.countDocuments({
    points: { $gt: profile?.points || 0 },
  });

  res.json({
    success: true,
    profile,
    leaderboardRank: higherRanked + 1,
  });
});

// @desc    Get top volunteers leaderboard
// @route   GET /api/volunteer/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res) => {
  const top = await VolunteerProfile.find()
    .sort({ points: -1 })
    .limit(20)
    .populate('userId', 'name profilePhoto city');

  res.json({ success: true, leaderboard: top });
});

module.exports = {
  getAssignedTasks,
  getOpenTasks,
  updateTaskStatus,
  toggleAvailability,
  getVolunteerProfile,
  getLeaderboard,
};
