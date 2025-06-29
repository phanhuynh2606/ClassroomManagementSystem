const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Reference to the stream item
    streamItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stream',
      required: true,
      index: true
    },
    // For nested comments/replies
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      index: true
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Comment threading and hierarchy
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 3 // Limit nesting to 3 levels
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Attachments for comments
    attachments: [{
      name: String,
      url: String,
      fileType: String,
      fileSize: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Engagement
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Status and moderation
    status: {
      type: String,
      enum: ['active', 'edited', 'deleted', 'hidden'],
      default: 'active',
      index: true
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    editHistory: [{
      content: String,
      editedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Moderation
    isReported: {
      type: Boolean,
      default: false
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reports: [{
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: {
        type: String,
        enum: ['inappropriate', 'spam', 'harassment', 'off-topic', 'other']
      },
      description: String,
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Visibility and permissions
    isPrivate: {
      type: Boolean,
      default: false
    },
    visibleTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Archive and delete
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedReason: String
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
commentSchema.index({ streamItem: 1, createdAt: -1 });
commentSchema.index({ streamItem: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, level: 1 });
commentSchema.index({ status: 1, isActive: 1 });
commentSchema.index({ streamItem: 1, status: 1, isActive: 1 });

// Compound index for main comment queries
commentSchema.index({ 
  streamItem: 1, 
  parentComment: 1, 
  status: 1, 
  isActive: 1, 
  createdAt: 1 
});

// Static methods
commentSchema.statics.getStreamComments = function(streamItemId, options = {}) {
  const {
    page = 1,
    limit = 10,
    includeReplies = true,
    sortOrder = 1 // 1 for ascending (oldest first), -1 for descending (newest first)
  } = options;

  const skip = (page - 1) * limit;
  const query = {
    streamItem: streamItemId,
    status: 'active',
    isActive: true
  };

  if (!includeReplies) {
    query.parentComment = { $exists: false };
  }

  return this.find(query)
    .populate('author', 'fullName email image role')
    .populate('replyTo', 'fullName')
    .sort({ createdAt: sortOrder })
    .skip(skip)
    .limit(limit);
};

commentSchema.statics.getCommentReplies = function(parentCommentId, options = {}) {
  const {
    page = 1,
    limit = 5,
    sortOrder = 1
  } = options;

  const skip = (page - 1) * limit;

  return this.find({
    parentComment: parentCommentId,
    status: 'active',
    isActive: true
  })
    .populate('author', 'fullName email image role')
    .populate('replyTo', 'fullName')
    .sort({ createdAt: sortOrder })
    .skip(skip)
    .limit(limit);
};

commentSchema.statics.createComment = function(data) {
  return this.create({
    ...data,
    status: 'active'
  });
};

commentSchema.statics.createReply = function(data) {
  return this.create({
    ...data,
    level: (data.level || 0) + 1,
    status: 'active'
  });
};

// Instance methods
commentSchema.methods.addLike = function(userId) {
  const existingLike = this.likedBy.find(like => 
    like.user.toString() === userId.toString()
  );

  if (!existingLike) {
    this.likedBy.push({ user: userId });
    this.likeCount += 1;
    return this.save();
  }
  
  return Promise.resolve(this);
};

commentSchema.methods.removeLike = function(userId) {
  const likeIndex = this.likedBy.findIndex(like => 
    like.user.toString() === userId.toString()
  );

  if (likeIndex > -1) {
    this.likedBy.splice(likeIndex, 1);
    this.likeCount = Math.max(0, this.likeCount - 1);
    return this.save();
  }
  
  return Promise.resolve(this);
};

commentSchema.methods.editContent = function(newContent) {
  // Save edit history
  if (this.content !== newContent) {
    this.editHistory.push({
      content: this.content
    });
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    this.status = 'edited';
  }
  
  return this.save();
};

commentSchema.methods.reportComment = function(reportData) {
  this.reports.push(reportData);
  this.reportCount += 1;
  this.isReported = true;
  
  return this.save();
};

commentSchema.methods.softDelete = function(deletedBy, reason) {
  this.status = 'deleted';
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletedReason = reason;
  
  return this.save();
};

// Middleware
commentSchema.pre('save', function(next) {
  // Ensure level doesn't exceed maximum
  if (this.level > 3) {
    this.level = 3;
  }
  next();
});

// Update parent comment reply count when comment is created
commentSchema.post('save', async function(doc) {
  if (doc.parentComment && doc.isNew) {
    await mongoose.model('Comment').findByIdAndUpdate(
      doc.parentComment,
      { $inc: { replyCount: 1 } }
    );
  }
});

// Update stream item comment count
commentSchema.post('save', async function(doc) {
  if (doc.isNew && doc.status === 'active') {
    await mongoose.model('Stream').findByIdAndUpdate(
      doc.streamItem,
      { $inc: { commentsCount: 1 } }
    );
  }
});

// Update counts when comment is deleted
commentSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'deleted' && doc.isActive === false) {
    // Decrease stream item comment count
    await mongoose.model('Stream').findByIdAndUpdate(
      doc.streamItem,
      { $inc: { commentsCount: -1 } }
    );
    
    // Decrease parent comment reply count
    if (doc.parentComment) {
      await mongoose.model('Comment').findByIdAndUpdate(
        doc.parentComment,
        { $inc: { replyCount: -1 } }
      );
    }
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment; 