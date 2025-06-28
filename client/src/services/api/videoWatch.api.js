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
  }
};

export default videoWatchAPI; 