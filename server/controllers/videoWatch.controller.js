const VideoWatch = require('../models/videoWatch.model');
const Classroom = require('../models/classroom.model');

// Start watching a video
const startWatching = async (req, res) => {
  try {
    const { videoData, classroomId, streamItemId } = req.body;
    const userId = req.user._id;

    // Verify classroom access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check user access to classroom
    const userRole = req.user.role;
    let hasAccess = false;
    
    if (userRole === 'admin') {
      hasAccess = true;
    } else if (userRole === 'teacher' && classroom.teacher.toString() === userId.toString()) {
      hasAccess = true;
    } else if (userRole === 'student') {
      hasAccess = classroom.students.some(s => 
        s.student && s.student.toString() === userId.toString()
      );
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this classroom'
      });
    }

    // Convert duration from MM:SS format to seconds if needed
    let durationInSeconds = 0;
    if (videoData.duration) {
      const parts = videoData.duration.split(':').map(p => parseInt(p) || 0);
      if (parts.length === 2) {
        durationInSeconds = parts[0] * 60 + parts[1]; // MM:SS
      } else if (parts.length === 3) {
        durationInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
      }
    }

    // Get or create watch record
    const watchRecord = await VideoWatch.getOrCreate(
      userId, 
      { ...videoData, durationInSeconds }, 
      classroomId, 
      streamItemId
    );

    // Start new session
    watchRecord.startSession(watchRecord.currentTime);
    await watchRecord.save();

    res.status(200).json({
      success: true,
      data: {
        watchId: watchRecord._id,
        currentTime: watchRecord.currentTime,
        progressPercent: watchRecord.progressPercent,
        isCompleted: watchRecord.isCompleted
      }
    });

  } catch (error) {
    console.error('Error starting video watch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting video watch'
    });
  }
};

// Update watch progress
const updateProgress = async (req, res) => {
  try {
    const { watchId } = req.params;
    const { currentTime, watchedSeconds } = req.body;
    const userId = req.user._id;

    const watchRecord = await VideoWatch.findOne({
      _id: watchId,
      user: userId
    });

    if (!watchRecord) {
      return res.status(404).json({
        success: false,
        message: 'Watch record not found'
      });
    }

    // Update progress
    await watchRecord.updateProgress(currentTime, watchRecord.duration);

    // Update session watched seconds
    if (watchRecord.sessions.length > 0) {
      const currentSession = watchRecord.sessions[watchRecord.sessions.length - 1];
      currentSession.watchedSeconds = watchedSeconds || 0;
    }

    // Check if should count as view
    const viewCounted = await watchRecord.trackView();

    await watchRecord.save();

    res.status(200).json({
      success: true,
      data: {
        currentTime: watchRecord.currentTime,
        progressPercent: watchRecord.progressPercent,
        isCompleted: watchRecord.isCompleted,
        viewCounted: viewCounted
      }
    });

  } catch (error) {
    console.error('Error updating watch progress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating progress'
    });
  }
};

// End watching session
const endWatching = async (req, res) => {
  try {
    const { watchId } = req.params;
    const { endPosition, sessionWatchedSeconds } = req.body;
    const userId = req.user._id;

    const watchRecord = await VideoWatch.findOne({
      _id: watchId,
      user: userId
    });

    if (!watchRecord) {
      return res.status(404).json({
        success: false,
        message: 'Watch record not found'
      });
    }

    // End current session
    watchRecord.endSession(endPosition, sessionWatchedSeconds);
    
    // Update final progress
    if (endPosition !== undefined) {
      await watchRecord.updateProgress(endPosition, watchRecord.duration);
    }

    await watchRecord.save();

    res.status(200).json({
      success: true,
      data: {
        totalWatchTime: watchRecord.watchedSeconds,
        progressPercent: watchRecord.progressPercent,
        isCompleted: watchRecord.isCompleted
      }
    });

  } catch (error) {
    console.error('Error ending watch session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while ending watch session'
    });
  }
};

// Get watch history for user
const getWatchHistory = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const watchHistory = await VideoWatch.find({
      user: userId,
      classroom: classroomId
    })
    .sort({ lastWatchedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('streamItem', 'title content type');

    const total = await VideoWatch.countDocuments({
      user: userId,
      classroom: classroomId
    });

    res.status(200).json({
      success: true,
      data: {
        history: watchHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting watch history'
    });
  }
};

// Get video analytics (for teachers)
const getVideoAnalytics = async (req, res) => {
  try {
    const { videoId, classroomId } = req.params;
    const userId = req.user._id;

    // Verify teacher access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    if (req.user.role !== 'admin' && classroom.teacher.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics'
      });
    }

    const analytics = await VideoWatch.getVideoAnalytics(videoId, classroomId);

    // Get detailed watch records for this video
    const watchRecords = await VideoWatch.find({
      videoId: videoId,
      classroom: classroomId
    })
    .populate('user', 'fullName email')
    .sort({ lastWatchedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        analytics: analytics,
        watchRecords: watchRecords.map(record => ({
          user: record.user,
          progressPercent: record.progressPercent,
          watchedSeconds: record.watchedSeconds,
          isCompleted: record.isCompleted,
          isViewCounted: record.isViewCounted,
          lastWatchedAt: record.lastWatchedAt,
          sessionsCount: record.sessions.length
        }))
      }
    });

  } catch (error) {
    console.error('Error getting video analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting analytics'
    });
  }
};

module.exports = {
  startWatching,
  updateProgress,
  endWatching,
  getWatchHistory,
  getVideoAnalytics
}; 