const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Task = require('../models/Task');
const AdminLog = require('../models/AdminLog');
const DonorProfile = require('../models/DonorProfile');
const NGOProfile = require('../models/NGOProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const { sendApprovalEmail } = require('../utils/sendEmail');
const { createNotification } = require('../utils/createNotification');
const { getIO } = require('../config/socket');

// @desc    Get users pending verification/approval
// @route   GET /api/admin/verification-queue
// @access  Private (admin)
const getVerificationQueue = asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({
    isApproved: false,
    isVerified: true,
    role: { $in: ['donor', 'ngo'] },
  }).sort({ createdAt: 1 });

  // Fetch their documents
  const results = await Promise.all(
    pendingUsers.map(async (user) => {
      let doc = null;
      if (user.role === 'donor') {
        doc = await DonorProfile.findOne({ userId: user._id }).select(
          'businessName businessType licenseNumber verificationDocument'
        );
      } else if (user.role === 'ngo') {
        doc = await NGOProfile.findOne({ userId: user._id }).select(
          'organisationName registrationNumber verificationDocument'
        );
      }
      return { user, profile: doc };
    })
  );

  res.json({ success: true, queue: results });
});

// @desc    Approve or reject a user
// @route   PUT /api/admin/users/:id/approve
// @access  Private (admin)
const approveUser = asyncHandler(async (req, res) => {
  const { approved, reason } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isApproved = approved;
  await user.save({ validateBeforeSave: false });

  // Log admin action
  await AdminLog.create({
    adminId: req.user._id,
    action: approved ? 'approve_user' : 'reject_user',
    targetId: user._id,
    targetType: 'User',
    notes: reason || '',
  });

  // Notify user in-app and via email
  await createNotification(
    user._id,
    approved
      ? 'Your account has been approved! You can now access all features.'
      : `Your account application was not approved. ${reason || ''}`,
    'account_approved',
    user._id,
    'User'
  );

  try {
    await sendApprovalEmail(user.email, user.name, approved, reason);
  } catch (err) {
    console.error('Approval email failed:', err.message);
  }

  res.json({ success: true, message: `User ${approved ? 'approved' : 'rejected'}`, user });
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    users,
  });
});

// @desc    Suspend or reinstate a user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (admin)
const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isSuspended = !user.isSuspended;
  await user.save({ validateBeforeSave: false });

  await AdminLog.create({
    adminId: req.user._id,
    action: 'suspend_user',
    targetId: user._id,
    targetType: 'User',
  });

  res.json({
    success: true,
    message: `User ${user.isSuspended ? 'suspended' : 'reinstated'}`,
    isSuspended: user.isSuspended,
  });
});

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
// @access  Private (admin)
const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalListings, totalDelivered,
    activeListings, totalDonors, totalNGOs, totalVolunteers,
  ] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'delivered' }),
    Listing.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'donor' }),
    User.countDocuments({ role: 'ngo' }),
    User.countDocuments({ role: 'volunteer' }),
  ]);

  const totalMeals = await Listing.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$estimatedMeals' } } },
  ]);

  // Registrations over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentRegistrations = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers, totalDonors, totalNGOs, totalVolunteers,
      totalListings, activeListings, totalDelivered,
      totalMealsEstimate: totalMeals[0]?.total || 0,
      recentRegistrations,
    },
  });
});

// @desc    Send a platform-wide announcement
// @route   POST /api/admin/announcement
// @access  Private (admin)
const sendAnnouncement = asyncHandler(async (req, res) => {
  const { message, targetRoles } = req.body;

  const query = targetRoles?.length ? { role: { $in: targetRoles } } : {};
  const users = await User.find(query).select('_id');

  // Create notifications in bulk
  const notifications = users.map((u) => ({
    userId: u._id,
    message,
    type: 'announcement',
  }));

  const Notification = require('../models/Notification');
  await Notification.insertMany(notifications);

  // Broadcast via socket
  try {
    const io = getIO();
    const rooms = users.map((u) => u._id.toString());
    rooms.forEach((room) => {
      io.to(room).emit('notification', { message, type: 'announcement' });
    });
  } catch (err) {
    console.warn('Socket broadcast failed:', err.message);
  }

  await AdminLog.create({
    adminId: req.user._id,
    action: 'send_announcement',
    targetId: req.user._id,
    targetType: 'User',
    notes: message,
  });

  res.json({
    success: true,
    message: `Announcement sent to ${users.length} users`,
  });
});

// @desc    Get live activity feed
// @route   GET /api/admin/activity
// @access  Private (admin)
const getLiveActivity = asyncHandler(async (req, res) => {
  const [activeListings, activeTasks] = await Promise.all([
    Listing.find({ status: { $in: ['active', 'claimed'] } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('donorId', 'name city')
      .populate('claimedBy', 'name'),
    Task.find({ status: { $in: ['assigned', 'in-progress', 'collected'] } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('volunteerId', 'name')
      .populate('listingId', 'foodName address'),
  ]);

  res.json({ success: true, activeListings, activeTasks });
});

module.exports = {
  getVerificationQueue,
  approveUser,
  getAllUsers,
  suspendUser,
  getPlatformStats,
  sendAnnouncement,
  getLiveActivity,
};
