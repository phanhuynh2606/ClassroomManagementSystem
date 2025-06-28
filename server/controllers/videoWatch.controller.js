const VideoWatch = require('../models/videoWatch.model');
const Classroom = require('../models/classroom.model');
const Stream = require('../models/stream.model');

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
      // Handle different duration formats
      if (typeof videoData.duration === 'number') {
        // Duration is already in seconds
        durationInSeconds = videoData.duration;
      } else if (typeof videoData.duration === 'string') {
        // Duration is in MM:SS or HH:MM:SS format
        const parts = videoData.duration.split(':').map(p => parseInt(p) || 0);
        if (parts.length === 2) {
          durationInSeconds = parts[0] * 60 + parts[1]; // MM:SS
        } else if (parts.length === 3) {
          durationInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
        } else if (parts.length === 1) {
          durationInSeconds = parts[0]; // Just seconds
        }
      }
    }

    // Get or create watch record
    const watchRecord = await VideoWatch.getOrCreate(
      userId, 
      { ...videoData, durationInSeconds }, 
      classroomId, 
      streamItemId
    );

    console.log('📄 Watch record found/created:', {
      watchId: watchRecord._id,
      currentTime: watchRecord.currentTime,
      progressPercent: watchRecord.progressPercent,
      isCompleted: watchRecord.isCompleted,
      sessionCount: watchRecord.sessions.length
    });

    // Start new session
    watchRecord.startSession(watchRecord.currentTime);
    await watchRecord.save();

    console.log('💾 Watch record saved with new session');

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

    console.log('📊 Update progress request:', {
      watchId,
      currentTime,
      watchedSeconds,
      userId
    });

    const watchRecord = await VideoWatch.findOne({
      _id: watchId,
      user: userId
    });

    if (!watchRecord) {
      console.log('❌ Watch record not found for update');
      return res.status(404).json({
        success: false,
        message: 'Watch record not found'
      });
    }

    console.log('📋 Current watch record state:', {
      currentTime: watchRecord.currentTime,
      progressPercent: watchRecord.progressPercent,
      isViewCounted: watchRecord.isViewCounted,
      totalSessions: watchRecord.sessions.length
    });

    // Update progress
    await watchRecord.updateProgress(currentTime, watchRecord.duration);

    // Update session watched seconds
    if (watchRecord.sessions.length > 0) {
      const currentSession = watchRecord.sessions[watchRecord.sessions.length - 1];
      currentSession.watchedSeconds = watchedSeconds || 0;
    }

    // Check previous view counted state before tracking
    const wasViewCounted = watchRecord.isViewCounted;
    
    // Check if should count as view
    const viewCounted = await watchRecord.trackView();

    await watchRecord.save();

    console.log('✅ Progress updated:', {
      newCurrentTime: watchRecord.currentTime,
      newProgressPercent: watchRecord.progressPercent,
      viewCounted: viewCounted,
      wasViewCounted: wasViewCounted,
      isCompleted: watchRecord.isCompleted
    });

    // If view was just counted (wasn't counted before, but is now), update Stream attachment viewCount
    if (viewCounted && !wasViewCounted) {
      try {
        console.log('🔄 Updating Stream attachment view count...');
        
        // Find stream item containing this video
        const streamItem = await Stream.findOne({
          classroom: watchRecord.classroom,
          'attachments.videoId': watchRecord.videoId,
          status: 'published',
          isActive: true
        });

        if (streamItem) {
          // Find the specific attachment and update its viewCount
          const attachment = streamItem.attachments.find(att => att.videoId === watchRecord.videoId);
          if (attachment) {
            // Get current total view count for this video
            const totalViews = await VideoWatch.countDocuments({
              videoId: watchRecord.videoId,
              classroom: watchRecord.classroom,
              isViewCounted: true
            });

            // Update attachment viewCount
            attachment.viewCount = totalViews.toString();
            
            // Also increment stream's global viewCount
            streamItem.viewCount = (streamItem.viewCount || 0) + 1;
            
            await streamItem.save();
            
            console.log('✅ Stream attachment view count updated:', {
              streamId: streamItem._id,
              videoId: watchRecord.videoId,
              newViewCount: totalViews,
              streamViewCount: streamItem.viewCount
            });
          } else {
            console.log('⚠️ Video attachment not found in stream item');
          }
        } else {
          console.log('⚠️ Stream item not found for video:', watchRecord.videoId);
        }
      } catch (error) {
        console.error('❌ Error updating stream view count:', error);
        // Don't fail the main request if stream update fails
      }
    }

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
    let { endPosition, sessionWatchedSeconds } = req.body;
    const userId = req.user._id;

    // Handle sendBeacon requests which might send data as text
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        endPosition = parsed.endPosition;
        sessionWatchedSeconds = parsed.sessionWatchedSeconds;
      } catch (parseError) {
        console.error('Error parsing sendBeacon data:', parseError);
      }
    }

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

// Get total view count for a video
const getVideoViewCount = async (req, res) => {
  try {
    const { videoId, classroomId } = req.params;
    const { syncToStream = false } = req.query; // Optional parameter to sync

    console.log('📊 Getting view count for:', { videoId, classroomId, syncToStream });

    // Count total views for this video in this classroom
    const viewCount = await VideoWatch.countDocuments({
      videoId: videoId,
      classroom: classroomId,
      isViewCounted: true
    });

    console.log('✅ View count result:', viewCount);

    // Optionally sync view count to Stream attachment
    if (syncToStream === 'true') {
      try {
        console.log('🔄 Syncing view count to Stream attachment...');
        
        const streamItem = await Stream.findOne({
          classroom: classroomId,
          'attachments.videoId': videoId,
          status: 'published',
          isActive: true
        });

        if (streamItem) {
          const attachment = streamItem.attachments.find(att => att.videoId === videoId);
          if (attachment) {
            attachment.viewCount = viewCount.toString();
            await streamItem.save();
            console.log('✅ Stream attachment view count synced:', viewCount);
          }
        }
      } catch (syncError) {
        console.error('❌ Error syncing to stream:', syncError);
        // Don't fail the main request
      }
    }

    res.status(200).json({
      success: true,
      data: {
        videoId,
        classroomId,
        viewCount
      }
    });

  } catch (error) {
    console.error('Error getting video view count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting view count'
    });
  }
};

// Sync all video view counts to Stream attachments (utility endpoint)
const syncViewCountsToStream = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user._id;

    // Verify teacher/admin access
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
        message: 'Not authorized to sync view counts'
      });
    }

    console.log('🔄 Syncing all video view counts for classroom:', classroomId);

    // Get all stream items with video attachments
    const streamItems = await Stream.find({
      classroom: classroomId,
      'attachments.type': { $in: ['video', 'video/youtube'] },
      status: 'published',
      isActive: true
    });

    let syncedCount = 0;
    let totalVideos = 0;

    for (const streamItem of streamItems) {
      for (const attachment of streamItem.attachments) {
        if (attachment.type === 'video' || attachment.type === 'video/youtube') {
          if (attachment.videoId) {
            totalVideos++;
            
            // Get current view count from VideoWatch
            const viewCount = await VideoWatch.countDocuments({
              videoId: attachment.videoId,
              classroom: classroomId,
              isViewCounted: true
            });

            // Update attachment viewCount
            const oldViewCount = attachment.viewCount;
            attachment.viewCount = viewCount.toString();
            
            console.log(`📊 Video ${attachment.videoId}: ${oldViewCount} → ${viewCount} views`);
            syncedCount++;
          }
        }
      }
      
      // Save the stream item with updated view counts
      await streamItem.save();
    }

    console.log('✅ View count sync completed:', {
      classroomId,
      totalVideos,
      syncedCount,
      streamItems: streamItems.length
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'View counts synced successfully',
        classroomId,
        totalVideos,
        syncedCount,
        streamItems: streamItems.length
      }
    });

  } catch (error) {
    console.error('Error syncing view counts to stream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while syncing view counts'
    });
  }
};

module.exports = {
  startWatching,
  updateProgress,
  endWatching,
  getWatchHistory,
  getVideoAnalytics,
  getVideoViewCount,
  syncViewCountsToStream
}; 