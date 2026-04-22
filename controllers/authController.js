const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DonorProfile = require('../models/DonorProfile');
const NGOProfile = require('../models/NGOProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const { sendTokenResponse, generateAccessToken } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, city, address } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Skip OTP generation entirely as per user request

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    city,
    address,
    isVerified: true,
  });

  // Create role-specific profile
  if (role === 'donor') {
    await DonorProfile.create({ userId: user._id });
  } else if (role === 'ngo') {
    await NGOProfile.create({ userId: user._id, organisationName: name });
  } else if (role === 'volunteer') {
    await VolunteerProfile.create({ userId: user._id });
  }

  // Immediately return token response and log the user in
  sendTokenResponse(user, 201, res);
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId).select(
    '+emailVerificationToken +emailVerificationExpires'
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    return res.json({ success: true, message: 'Email already verified' });
  }

  if (
    user.emailVerificationToken !== otp ||
    user.emailVerificationExpires < Date.now()
  ) {
    res.status(400);
    throw new Error('Invalid or expired verification code');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email already verified');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationToken = otp;
  user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user.email, user.name, otp);

  res.json({ success: true, message: 'Verification code resent' });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Incorrect email or password');
  }

  if (user.isSuspended) {
    res.status(403);
    throw new Error('Your account has been suspended. Please contact support.');
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh
// @access  Public (uses cookie)
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// @desc    Logout — clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Forgot password — send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // Always return success to avoid email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Email could not be sent. Please try again.');
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

module.exports = {
  register,
  verifyEmail,
  resendOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
