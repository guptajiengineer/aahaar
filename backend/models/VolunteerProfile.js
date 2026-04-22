const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    linkedNGO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    serviceArea: {
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
    serviceRadius: {
      type: Number,
      default: 10, // km
    },
    availability: {
      type: Boolean,
      default: true,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        name: { type: String },
        earnedAt: { type: Date, default: Date.now },
        icon: { type: String },
      },
    ],
  },
  { timestamps: true }
);

volunteerProfileSchema.index({ serviceArea: '2dsphere' });

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
