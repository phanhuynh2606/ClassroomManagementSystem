import axiosClient from '../axiosClient';

const notificationAPI = {
  getAll: () => axiosClient.get('/notifications'),
  getById: (id) => axiosClient.get(`/notifications/${id}`),
  create: (data) => axiosClient.post('/notifications', data),
  update: (id, data) => axiosClient.put(`/notifications/${id}`, data),
  delete: (id) => axiosClient.delete(`/notifications/${id}`),
};

export default notificationAPI; 