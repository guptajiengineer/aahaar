const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'approve_user',
        'reject_user',
        'suspend_user',
        'delete_user',
        'send_announcement',
        'flag_content',
        'resolve_flag',
        'view_stats',
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['User', 'Listing', 'Task', 'Message'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

adminLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
