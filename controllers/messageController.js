const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Listing = require('../models/Listing');
const { getIO } = require('../config/socket');

// @desc    Get all messages in a listing thread
// @route   GET /api/messages/:listingId
// @access  Private (must be donor, claimedBy NGO, or assigned volunteer)
const getThread = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Access control: only involved parties can read the thread
  const userId = req.user._id.toString();
  const isInvolved =
    listing.donorId.toString() === userId ||
    listing.claimedBy?.toString() === userId ||
    listing.assignedVolunteer?.toString() === userId ||
    req.user.role === 'admin';

  if (!isInvolved) {
    res.status(403);
    throw new Error('You are not part of this conversation');
  }

  const messages = await Message.find({ threadId: req.params.listingId })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name profilePhoto role');

  res.json({ success: true, messages });
});

// @desc    Send a message in a listing thread
// @route   POST /api/messages/:listingId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const listing = await Listing.findById(req.params.listingId);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const userId = req.user._id.toString();
  const isInvolved =
    listing.donorId.toString() === userId ||
    listing.claimedBy?.toString() === userId ||
    listing.assignedVolunteer?.toString() === userId;

  if (!isInvolved) {
    res.status(403);
    throw new Error('You cannot send messages in this thread');
  }

  const message = await Message.create({
    threadId: listing._id,
    senderId: req.user._id,
    content: content.trim(),
  });

  const populated = await message.populate('senderId', 'name profilePhoto role');

  // Emit to all users in this listing's thread room
  try {
    const io = getIO();
    io.to(`thread_${listing._id}`).emit('new_message', populated);
  } catch (err) {
    console.warn('Socket emit failed for message:', err.message);
  }

  res.status(201).json({ success: true, message: populated });
});

module.exports = { getThread, sendMessage };
