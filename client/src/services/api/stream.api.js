import axiosClient from '../axiosClient';

const streamAPI = {
  // Get classroom stream
  getClassroomStream: (classroomId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/stream/classroom/${classroomId}?${query}`);
  },

  // Create announcement
  createAnnouncement: (classroomId, data) => {
    return axiosClient.post(`/stream/classroom/${classroomId}/announcements`, data);
  },

  // Update announcement
  updateAnnouncement: (streamId, data) => {
    return axiosClient.put(`/stream/announcements/${streamId}`, data);
  },

  // Delete announcement
  deleteAnnouncement: (streamId) => {
    return axiosClient.delete(`/stream/announcements/${streamId}`);
  },

  // Pin/Unpin announcement
  togglePinAnnouncement: (streamId) => {
    return axiosClient.patch(`/stream/announcements/${streamId}/pin`);
  },

  // Upload attachment
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return axiosClient.post('/stream/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Comment functionality
  addComment: (streamId, content) => {
    return axiosClient.post(`/stream/items/${streamId}/comments`, { content });
  },

  getComments: (streamId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/stream/items/${streamId}/comments?${query}`);
  },

  updateComment: (streamId, commentId, content) => {
    return axiosClient.put(`/stream/items/${streamId}/comments/${commentId}`, { content });
  },

  deleteComment: (streamId, commentId) => {
    return axiosClient.delete(`/stream/items/${streamId}/comments/${commentId}`);
  },

  // Stream item management (for all types)
  updateStreamItem: (streamId, data) => {
    return axiosClient.put(`/stream/items/${streamId}`, data);
  },

  deleteStreamItem: (streamId) => {
    return axiosClient.delete(`/stream/items/${streamId}`);
  },

  togglePinStreamItem: (streamId) => {
    return axiosClient.patch(`/stream/items/${streamId}/pin`);
  }
};

export default streamAPI; 