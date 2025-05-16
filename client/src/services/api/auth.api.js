import axiosClient from '../axiosClient';

const authAPI = {
  login: (email, password) => axiosClient.post('/auth/login', { email, password }),
  logout: () => axiosClient.post('/auth/logout'),
  checkAuth: () => axiosClient.get('/auth/me'),
  getProfile: () => axiosClient.get('/auth/me'),
  updateProfile: (data) => axiosClient.put('/auth/profile', data),
  updatePassword: (data) => axiosClient.put('/auth/password', data),
  uploadImage: (formData) => axiosClient.post('/auth/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default authAPI; 