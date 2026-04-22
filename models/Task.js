const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'in-progress', 'collected', 'delivered'],
      default: 'assigned',
    },
    pickupPhoto: {
      type: String, // Cloudinary URL
      default: null,
    },
    deliveryPhoto: {
      type: String, // Cloudinary URL
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
