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
    type: {
      type: String,
      enum: ['system', 'classroom', 'assignment', 'quiz'],
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
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
      deleted: {
        type: Boolean,
        default: false
      },
      deletedAt: Date
    }],
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      index: true
    },
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
    },
    onModel: {
      type: String,
      enum: ['Assignment', 'Quiz', 'Material'],
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'reminder', 'announcement'],
      default: 'announcement'
    },
    actionUrl: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    scheduledFor: Date,
    expiresAt: Date
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