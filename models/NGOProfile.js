const mongoose = require('mongoose');

const ngoProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    organisationName: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    verificationDocument: {
      type: String, // Cloudinary URL
      default: null,
    },
    // Array of service area circles: [{ lat, lng, radius (km) }]
    serviceAreas: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        radius: { type: Number, default: 10 }, // in km
      },
    ],
    primaryLocation: {
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
    assignedVolunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalMealsServed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ngoProfileSchema.index({ primaryLocation: '2dsphere' });

module.exports = mongoose.model('NGOProfile', ngoProfileSchema);
