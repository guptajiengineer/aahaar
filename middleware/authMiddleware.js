const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// ─── TESTING FLAG ─────────────────────────────────────────────────────────────
// Set BYPASS_AUTH=true to skip all token verification and allow every request.
// Revert by removing this flag (or setting it to false) before going to production.
const BYPASS_AUTH = true;

const MOCK_USER = {
  _id: '000000000000000000000000',
  name: 'Test Admin',
  email: 'admin@aahaar.com',
  role: 'admin',
  isVerified: true,
  isApproved: true,
  isSuspended: false,
  city: 'Global',
  profilePhoto: null,
};
// ──────────────────────────────────────────────────────────────────────────────

const protect = asyncHandler(async (req, res, next) => {
  // ── BYPASS: skip all auth checks for testing ──
  if (BYPASS_AUTH) {
    req.user = MOCK_USER;
    return next();
  }
  // ─────────────────────────────────────────────

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorised, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    if (user.isSuspended) {
      res.status(403);
      throw new Error('Your account has been suspended. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401);
      throw new Error('Not authorised, invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Token expired, please log in again');
    }
    throw error;
  }
});

module.exports = { protect };
