const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const DonorProfile = require('../models/DonorProfile');
const NGOProfile = require('../models/NGOProfile');
const VolunteerProfile = require('../models/VolunteerProfile');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  let profile = null;
  if (req.user.role === 'donor') {
    profile = await DonorProfile.findOne({ userId: req.user._id });
  } else if (req.user.role === 'ngo') {
    profile = await NGOProfile.findOne({ userId: req.user._id });
  } else if (req.user.role === 'volunteer') {
    profile = await VolunteerProfile.findOne({ userId: req.user._id });
  }

  res.json({
    success: true,
    user,
    profile,
  });
});

// @desc    Update user profile (name, phone, city, address)
// @route   PUT /api/users/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, city, address } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, city, address },
    { new: true, runValidators: true }
  );

  res.json({ success: true, user });
});

// @desc    Upload profile photo
// @route   PUT /api/users/me/photo
// @access  Private
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a photo');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePhoto: req.file.path },
    { new: true }
  );

  res.json({ success: true, profilePhoto: user.profilePhoto });
});

module.exports = { getMe, updateMe, uploadProfilePhoto };
