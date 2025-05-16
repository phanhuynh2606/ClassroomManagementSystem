import axiosClient from '../axiosClient';

const quizAPI = {
  getAll: () => axiosClient.get('/quizzes'),
  getById: (id) => axiosClient.get(`/quizzes/${id}`),
  create: (data) => axiosClient.post('/quizzes', data),
  update: (id, data) => axiosClient.put(`/quizzes/${id}`, data),
  delete: (id) => axiosClient.delete(`/quizzes/${id}`),
};

export default quizAPI; 