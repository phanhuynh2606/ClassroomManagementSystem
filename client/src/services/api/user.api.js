

import axiosClient from '../axiosClient';

const userAPI = {

  // Get user by ID
  getUserById: (id) => {
    return axiosClient.get(`/users/${id}`);
  },

  // Create new user
  createUser: (userData) => {
    return axiosClient.post('/users', userData);
  },

  // Update profile
  updateProfile: ( userData) => {
    return axiosClient.put(`/users/profile`, userData);
  },
  // Update user
  updateUser: (id, userData) => {
    return axiosClient.put(`/users/${id}`, userData);
  },

  // Delete user
  deleteUser: (id) => {
    return axiosClient.delete(`/users/${id}`);
  },

  // Update user status (active/inactive)
  updateUserStatus: (id, status) => {
    return axiosClient.patch(`/users/${id}/status`, { status });
  },

  // Get user statistics
  getUserStats: () => {
    return axiosClient.get('/users/stats');
  }
};

export default userAPI; 