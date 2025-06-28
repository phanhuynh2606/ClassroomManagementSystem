import axiosClient from '../axiosClient';

const videoWatchAPI = {
  // Start watching a video
  startWatching: (videoData, classroomId, streamItemId) => {
    return axiosClient.post('/video-watch/start', {
      videoData,
      classroomId,
      streamItemId
    });
  },

  // Update watch progress
  updateProgress: (watchId, currentTime, watchedSeconds) => {
    return axiosClient.put(`/video-watch/progress/${watchId}`, {
      currentTime,
      watchedSeconds
    });
  },

  // End watching session
  endWatching: (watchId, endPosition, sessionWatchedSeconds) => {
    return axiosClient.post(`/video-watch/end/${watchId}`, {
      endPosition,
      sessionWatchedSeconds
    });
  },

  // Get user's watch history
  getWatchHistory: (classroomId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/video-watch/history/${classroomId}?${query}`);
  },

  // Get video analytics (teachers only)
  getVideoAnalytics: (classroomId, videoId) => {
    return axiosClient.get(`/video-watch/analytics/${classroomId}/${videoId}`);
  },

  // Get total view count for a video
  getVideoViewCount: (classroomId, videoId, syncToStream = false) => {
    const params = syncToStream ? '?syncToStream=true' : '';
    return axiosClient.get(`/video-watch/view-count/${classroomId}/${videoId}${params}`);
  },

  // Sync all video view counts to Stream attachments (teachers/admin only)
  syncViewCountsToStream: (classroomId) => {
    return axiosClient.post(`/video-watch/sync-view-counts/${classroomId}`);
  }
};

export default videoWatchAPI; 