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
      enum: [
        'system',        // Admin system-wide notifications
        'class_general', // Teacher to entire class
        'class_specific',// Teacher to specific students in class
        'personal',      // Personal notification to specific user
        'deadline',      // Assignment/quiz deadlines
        'reminder'       // General reminders
      ],
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }],
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      index: true
    },
    targetRole: {
      type: String,
      enum: ['admin', 'teacher', 'student', 'all'],
      index: true
    },
    metadata: {
      assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
      },
      quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
      },
      materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material'
      },
      relatedUrl: String
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ sender: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1 });
notificationSchema.index({ classroom: 1, type: 1 });
notificationSchema.index({ targetRole: 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });



// Static method to get notifications for user
notificationSchema.statics.getForUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    priority = null
  } = options;

  const query = {
    recipients: userId
  };

  if (type) {
    query.type = type;
  }

  if (priority) {
    query.priority = priority;
  }

  return this.find(query)
    .populate('sender', 'fullName email role image')
    .populate('classroom', 'name code')
    .sort({ createdAt: -1, priority: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 