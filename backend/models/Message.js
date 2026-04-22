const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // threadId is always the listingId — one thread per donation
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ threadId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
