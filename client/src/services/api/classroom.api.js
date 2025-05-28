import axiosClient from '../axiosClient';

const classroomAPI = {
  // Dành cho Admin
  getAllByAdmin: () => axiosClient.get('/classrooms/admin'),
  createByAdmin: (data) => axiosClient.post('/classrooms/admin', data),
  updateByAdmin: (id, data) => axiosClient.put(`/classrooms/admin/${id}`, data),
  deleteByAdmin: (id) => axiosClient.delete(`/classrooms/admin/${id}`),

  // Dành cho Teacher
  getAllByTeacher: () => axiosClient.get('/classrooms/teacher'),
  createByTeacher: (data) => axiosClient.post('/classrooms/teacher', data),
  updateByTeacher: (id, data) => axiosClient.put(`/classrooms/teacher/${id}`, data),
  deleteByTeacher: (id) => axiosClient.delete(`/classrooms/teacher/${id}`),

  // Dùng chung
  getById: (id) => axiosClient.get(`/classrooms/${id}`),
};

export default classroomAPI;