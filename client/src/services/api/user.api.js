

import axiosClient from '../axiosClient';

const userAPI = {

  // Get all users (admin only)
  getAllUsers: () => {
    return axiosClient.get('/admin/users');
  },

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
  updateProfileImage: (userData) => {
    return axiosClient.post(`/users/profile/image`, userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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