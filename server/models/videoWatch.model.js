const mongoose = require('mongoose');

const videoWatchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Video information
  videoId: {
    type: String, // YouTube video ID hoặc internal video ID
    required: true
  },
  
  videoUrl: {
    type: String,
    required: true
  },
  
  videoTitle: {
    type: String,
    required: true
  },
  
  videoType: {
    type: String,
    enum: ['youtube', 'uploaded'],
    required: true
  },
  
  // Source context
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  
  streamItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stream'
  },
  
  // Watch progress
  currentTime: {
    type: Number, // Current position in seconds
    default: 0
  },
  
  duration: {
    type: Number, // Total video duration in seconds
    default: 0
  },
  
  watchedSeconds: {
    type: Number, // Total seconds watched (can be > duration if rewatched)
    default: 0
  },
  
  progressPercent: {
    type: Number, // Percentage of video watched
    default: 0
  },
  
  // View tracking
  isViewCounted: {
    type: Boolean,
    default: false
  },
  
  viewCountedAt: {
    type: Date
  },
  
  // Watch status
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  completedAt: {
    type: Date
  },
  
  // Session tracking
  sessions: [{
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    watchedSeconds: {
      type: Number,
      default: 0
    },
    startPosition: {
      type: Number,
      default: 0
    },
    endPosition: {
      type: Number,
      default: 0
    }
  }],
  
  // Metadata
  lastWatchedAt: {
    type: Date,
    default: Date.now
  },
  
  firstWatchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
videoWatchSchema.index({ user: 1, videoId: 1, classroom: 1 }, { unique: true });
videoWatchSchema.index({ classroom: 1, videoId: 1 });
videoWatchSchema.index({ user: 1, lastWatchedAt: -1 });

// Update progress method
videoWatchSchema.methods.updateProgress = async function(currentTime, duration) {
  this.currentTime = currentTime;
  this.duration = duration || this.duration;
  this.lastWatchedAt = new Date();
  
  if (this.duration > 0) {
    this.progressPercent = Math.round((currentTime / this.duration) * 100);
    
    // Mark as completed if watched > 90%
    if (this.progressPercent >= 90 && !this.isCompleted) {
      this.isCompleted = true;
      this.completedAt = new Date();
    }
  }
  
  await this.save();
};

// Track view method (count view after 30 seconds or 25% watched)
videoWatchSchema.methods.trackView = async function() {
  if (this.isViewCounted) return false;
  
  const minWatchTime = 30; // 30 seconds
  const minWatchPercent = 25; // 25%
  
  const shouldCountView = this.watchedSeconds >= minWatchTime || 
                         this.progressPercent >= minWatchPercent;
  
  if (shouldCountView) {
    this.isViewCounted = true;
    this.viewCountedAt = new Date();
    await this.save();
    return true;
  }
  
  return false;
};

// Start new session
videoWatchSchema.methods.startSession = function(startPosition = 0) {
  this.sessions.push({
    startTime: new Date(),
    startPosition: startPosition,
    watchedSeconds: 0
  });
};

// End current session
videoWatchSchema.methods.endSession = function(endPosition, watchedSeconds) {
  if (this.sessions.length > 0) {
    const currentSession = this.sessions[this.sessions.length - 1];
    currentSession.endTime = new Date();
    currentSession.endPosition = endPosition;
    currentSession.watchedSeconds = watchedSeconds;
    
    // Update total watched seconds
    this.watchedSeconds += watchedSeconds;
  }
};

// Static method to get or create watch record
videoWatchSchema.statics.getOrCreate = async function(userId, videoData, classroomId, streamItemId) {
  let watchRecord = await this.findOne({
    user: userId,
    videoId: videoData.videoId || videoData.id,
    classroom: classroomId
  });
  
  if (!watchRecord) {
    watchRecord = new this({
      user: userId,
      videoId: videoData.videoId || videoData.id,
      videoUrl: videoData.url,
      videoTitle: videoData.title || videoData.name,
      videoType: videoData.type === 'video/youtube' ? 'youtube' : 'uploaded',
      classroom: classroomId,
      streamItem: streamItemId,
      duration: videoData.durationInSeconds || 0
    });
    
    await watchRecord.save();
  }
  
  return watchRecord;
};

// Static method to get video analytics
videoWatchSchema.statics.getVideoAnalytics = async function(videoId, classroomId) {
  const analytics = await this.aggregate([
    {
      $match: {
        videoId: videoId,
        classroom: new mongoose.Types.ObjectId(classroomId)
      }
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: { $cond: ['$isViewCounted', 1, 0] } },
        totalWatchers: { $sum: 1 },
        totalWatchTime: { $sum: '$watchedSeconds' },
        completions: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        avgProgress: { $avg: '$progressPercent' }
      }
    }
  ]);
  
  return analytics[0] || {
    totalViews: 0,
    totalWatchers: 0,
    totalWatchTime: 0,
    completions: 0,
    avgProgress: 0
  };
};

module.exports = mongoose.model('VideoWatch', videoWatchSchema); 