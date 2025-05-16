import axiosClient from '../axiosClient';

const classroomAPI = {
  getAll: () => axiosClient.get('/classrooms'),
  getById: (id) => axiosClient.get(`/classrooms/${id}`),
  create: (data) => axiosClient.post('/classrooms', data),
  update: (id, data) => axiosClient.put(`/classrooms/${id}`, data),
  delete: (id) => axiosClient.delete(`/classrooms/${id}`),
};

export default classroomAPI; 