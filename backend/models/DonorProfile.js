const mongoose = require('mongoose');

const donorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      enum: ['restaurant', 'hotel', 'cafe', 'household', 'event', 'other'],
      default: 'household',
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    verificationDocument: {
      type: String, // Cloudinary URL
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    operatingHours: {
      type: String,
      trim: true,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    totalMealsEstimate: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

donorProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('DonorProfile', donorProfileSchema);
