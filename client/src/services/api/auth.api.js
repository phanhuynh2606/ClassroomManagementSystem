import axiosClient from '../axiosClient';

const authApi = {
  login: (data) => {
    return axiosClient.post('/auth/login', data);
  },

  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },

  logout: () => {
    return axiosClient.post('/auth/logout');
  },

  getProfile: () => {
    return axiosClient.get('/users/profile');
  },

  updateProfile: (data) => {
    return axiosClient.put('/users/profile', data);
  },

  uploadProfileImage: (formData) => {
    return axiosClient.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default authApi; 