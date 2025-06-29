const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema(
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
      enum: ['announcement', 'assignment', 'material', 'activity', 'quiz', 'student_post'],
      required: true,
      index: true
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Reference to the actual resource (assignment, material, quiz)
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resourceModel',
      index: true
    },
    resourceModel: {
      type: String,
      enum: ['Assignment', 'Material', 'Quiz'],
      index: true
    },
    // For announcements and activities
    description: {
      type: String,
      trim: true,
    },
    attachments: [{
      name: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['file', 'link', "video",'video/youtube'],
        default: 'file'
      },
      fileType: String,
      fileSize: Number, // in bytes
      size: String, // Human readable size (e.g., "2.5 MB")
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      // YouTube video specific fields
      videoId: String, // YouTube video ID
      thumbnail: String, // YouTube thumbnail URL
      duration: String, // Video duration (e.g., "4:13")
      channel: String, // YouTube channel name
      channelThumbnail: String, // Channel avatar URL
      viewCount: String, // View count (e.g., "1.2M views")
      description: String, // Video description
      // Link specific fields
      title: String, // Link title or video title
      favicon: String, // Website favicon URL
      // Additional metadata
      metadata: mongoose.Schema.Types.Mixed
    }],
    // For assignments and quizzes
    dueDate: {
      type: Date,
      index: true
    },
    totalPoints: {
      type: Number,
      min: 0
    },
    // Target audience for announcements
    targetAudience: {
      type: String,
      enum: ['all_students', 'specific_students'],
      default: 'all_students'
    },
    targetStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Stream settings
    allowComments: {
      type: Boolean,
      default: true
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Activity specific fields
    activityType: {
      type: String,
      enum: ['student_joined', 'student_left', 'assignment_submitted', 'quiz_completed', 'material_uploaded'],
      index: true
    },
    activityData: {
      studentName: String,
      submissionCount: Number,
      // Additional activity-specific data can be stored here
      metadata: mongoose.Schema.Types.Mixed
    },
    // Status and visibility
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'deleted'],
      default: 'published',
      index: true
    },
    visibility: {
      type: String,
      enum: ['public', 'students_only', 'specific_users'],
      default: 'students_only'
    },
    // Scheduling
    publishAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    // Engagement metrics
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true
    },
    pinnedAt: Date,
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Archive and delete
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    archivedAt: Date,
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
streamSchema.index({ classroom: 1, publishAt: -1, status: 1 });
streamSchema.index({ classroom: 1, type: 1, publishAt: -1 });
streamSchema.index({ author: 1, createdAt: -1 });
streamSchema.index({ classroom: 1, pinned: -1, publishAt: -1 });
streamSchema.index({ type: 1, activityType: 1 });
streamSchema.index({ resourceId: 1, resourceModel: 1 });
streamSchema.index({ status: 1, isActive: 1 });

// Compound index for main stream query
streamSchema.index({ 
  classroom: 1, 
  status: 1, 
  isActive: 1, 
  publishAt: -1 
});

// Virtual for populated resource
streamSchema.virtual('resource', {
  ref: function() {
    return this.resourceModel;
  },
  localField: 'resourceId',
  foreignField: '_id',
  justOne: true
});

// Virtual for recent comments
streamSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'streamItem',
  options: {
    match: { status: 'active', isActive: true },
    sort: { createdAt: 1 },
    limit: 5,
    populate: {
      path: 'author',
      select: 'fullName email image role'
    }
  }
});

// Ensure virtual fields are serialized
streamSchema.set('toObject', { virtuals: true });
streamSchema.set('toJSON', { virtuals: true });

// Static methods
streamSchema.statics.getClassroomStream = async function(classroomId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    includeArchived = false
  } = options;

  const skip = (page - 1) * limit;
  const query = {
    classroom: classroomId,
    status: includeArchived ? { $in: ['published', 'archived'] } : 'published',
    isActive: true,
    publishAt: { $lte: new Date() }
  };

  if (type) {
    query.type = type;
  }

  const streamItems = await this.find(query)
    .populate('author', 'fullName email image role')
    .populate('resource')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'fullName email image role'
      }
    })
    .sort({ pinned: -1, publishAt: -1 })
    .skip(skip)
    .limit(limit);

  return streamItems;
};

streamSchema.statics.createAnnouncement = function(data) {
  return this.create({
    ...data,
    type: 'announcement',
    status: 'published'
  });
};

streamSchema.statics.createActivity = function(classroomId, authorId, activityType, activityData) {
  const titles = {
    student_joined: `${activityData.studentName} joined the class`,
    student_left: `${activityData.studentName} left the class`,
    assignment_submitted: `New assignment submission received`,
    quiz_completed: `Quiz completed by ${activityData.studentName}`,
    material_uploaded: `New material uploaded`
  };

  return this.create({
    title: titles[activityType] || 'Classroom activity',
    content: '',
    type: 'activity',
    classroom: classroomId,
    author: authorId,
    activityType,
    activityData,
    allowComments: false
  });
};

// Instance methods
streamSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

streamSchema.methods.pin = function(userId) {
  this.pinned = true;
  this.pinnedAt = new Date();
  this.pinnedBy = userId;
  return this.save();
};

streamSchema.methods.unpin = function() {
  this.pinned = false;
  this.pinnedAt = null;
  this.pinnedBy = null;
  return this.save();
};

// Middleware
streamSchema.pre('save', function(next) {
  if (this.isModified('publishAt') && this.publishAt > new Date()) {
    this.status = 'draft';
  }
  next();
});

const Stream = mongoose.model('Stream', streamSchema);

module.exports = Stream; 