const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1,
    },
    unit: {
      type: String,
      enum: ['kg', 'litres', 'portions', 'packets', 'boxes', 'items'],
      default: 'portions',
    },
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'both'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    photo: {
      type: String, // Cloudinary URL
      default: null,
    },
    pickupWindowStart: {
      type: Date,
      required: [true, 'Pickup window start time is required'],
    },
    pickupWindowEnd: {
      type: Date,
      required: [true, 'Pickup window end time is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'claimed', 'collected', 'delivered', 'closed'],
      default: 'active',
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estimatedMeals: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

listingSchema.index({ location: '2dsphere' });
listingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
