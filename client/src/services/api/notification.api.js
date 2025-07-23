import axiosClient from '../axiosClient';

const notificationAPI = {
  // Get notifications for current user with filters
  getMyNotifications: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    if (params.type) queryParams.append('type', params.type);
    if (params.priority) queryParams.append('priority', params.priority);
    
    const queryString = queryParams.toString();
    return axiosClient.get(`/notifications/my-notifications${queryString ? `?${queryString}` : ''}`);
  },



  // Create notification (Teachers and Admins)
  createNotification: (data) => axiosClient.post('/notifications', data),

  // Get classroom students for notification creation
  getClassroomStudents: (classroomId) => 
    axiosClient.get(`/notifications/classroom/${classroomId}/students`),

  // Admin only - Get all notifications
  getAllNotifications: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.sender) queryParams.append('sender', params.sender);
    
    const queryString = queryParams.toString();
    return axiosClient.get(`/notifications/all${queryString ? `?${queryString}` : ''}`);
  },

  // Delete notification (Admin/Sender only)
  deleteNotification: (notificationId) => 
    axiosClient.delete(`/notifications/${notificationId}`),

  // Legacy methods for backward compatibility
  getAll: () => axiosClient.get('/notifications/my-notifications'),
  getById: (id) => axiosClient.get(`/notifications/${id}`),
  create: (data) => axiosClient.post('/notifications', data),
  update: (id, data) => axiosClient.put(`/notifications/${id}`, data),
  delete: (id) => axiosClient.delete(`/notifications/${id}`),
};

export default notificationAPI; 