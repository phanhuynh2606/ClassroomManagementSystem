import axiosClient from '../axiosClient';

const authAPI = {
  login: (email, password) => axiosClient.post('/auth/login', { email, password }),
  register: (userData) => axiosClient.post('/auth/register', userData),
  googleLogin: (credential) => axiosClient.post('/auth/google', { credential }),
  logout: () => axiosClient.post('/auth/logout'),
  checkAuth: () => axiosClient.get('/auth/me'),
  getProfile: async () => {
    const response = await axiosClient.get(`/auth/me`);
    return response;
  },
  updateProfile: (data) => axiosClient.put('/auth/profile', data),
  updatePassword: (data) => axiosClient.put('/auth/password', data),
  uploadImage: (formData) => axiosClient.post('/auth/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  logoutDevice: async (token) => {
    const response = await axiosClient.post(`/auth/logout-device`, { token });
    return response;
  },
  logoutAllDevices: async () => {
    const response = await axiosClient.post(`/auth/logout-all`);
    return response;
  },
  getUserDevices: async () => {
    const response = await axiosClient.get(`/auth/devices`);
    return response;
  },

  // Forgot password
  forgotPassword: (email) => {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (token, password) => {
    return axiosClient.post(`/auth/reset-password/${token}`, { password });
  },

  // Verify reset token
  verifyResetToken: (token) => {
    return axiosClient.get(`/auth/verify-reset-token/${token}`);
  }
};

export default authAPI;