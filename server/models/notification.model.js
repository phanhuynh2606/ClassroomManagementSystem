const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipients: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      read: {
        type: Boolean,
        default: false,
      },
      readAt: Date,
    }],
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      index: true
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ type: 1, isActive: 1 });
notificationSchema.index({ sender: 1, createdAt: -1 });
notificationSchema.index({ 'recipients.user': 1, 'recipients.read': 1 });
notificationSchema.index({ classroom: 1, type: 1 });
notificationSchema.index({ scheduledFor: 1 }, { sparse: true });
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 