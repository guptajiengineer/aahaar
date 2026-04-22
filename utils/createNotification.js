const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

/**
 * Create a notification in the DB and emit it in real-time via Socket.io.
 * @param {string} userId - Recipient user ID
 * @param {string} message - Notification message text
 * @param {string} type - Notification type enum
 * @param {string|null} relatedId - Related document ID (optional)
 * @param {string|null} relatedModel - Related model name (optional)
 */
const createNotification = async (userId, message, type, relatedId = null, relatedModel = null) => {
  try {
    const notification = await Notification.create({
      userId,
      message,
      type,
      relatedId,
      relatedModel,
    });

    // Emit to user's personal socket room
    try {
      const io = getIO();
      io.to(userId.toString()).emit('notification', notification);
    } catch (socketError) {
      // Socket may not be initialized in test environments — fail silently
      console.warn('Socket.io not available for notification emit');
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = { createNotification };
