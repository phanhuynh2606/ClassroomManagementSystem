import axiosClient from '../axiosClient';

const classroomAPI = {
  // Admin APIs
  getAllByAdmin: () => axiosClient.get('/classrooms/admin'),
  createByAdmin: (data) => axiosClient.post('/classrooms/admin', data),
  updateByAdmin: (id, data) => axiosClient.put(`/classrooms/admin/${id}`, data),
  deleteByAdmin: (id) => axiosClient.delete(`/classrooms/admin/${id}`),
  
  // Admin approval APIs
  approveClassroom: (id) => axiosClient.put(`/classrooms/admin/${id}/approve`),
  rejectClassroom: (id, reason) => axiosClient.put(`/classrooms/admin/${id}/reject`, { reason }),
  approveDeletion: (id) => axiosClient.put(`/classrooms/admin/${id}/approve-deletion`),

  // Teacher APIs
  getAllByTeacher: () => axiosClient.get('/classrooms/teacher'),
  createByTeacher: (data) => axiosClient.post('/classrooms/teacher', data),
  updateByTeacher: (id, data) => axiosClient.put(`/classrooms/teacher/${id}`, data),
  deleteByTeacher: (id) => axiosClient.delete(`/classrooms/teacher/${id}`),
  getStudentsByTeacher: (id) => axiosClient.get(`/classrooms/teacher/${id}/students`),

  // Student APIs
  getAllByStudent: () => axiosClient.get('/classrooms/student'),
  joinClassroom: (code) => axiosClient.post('/classrooms/student/join', { code }),
  leaveClassroom: (id) => axiosClient.delete(`/classrooms/student/${id}/leave`),

  // Shared APIs
  getStudents: (id) => axiosClient.get(`/classrooms/${id}/students`),
  getById: (id) => axiosClient.get(`/classrooms/${id}`),
  getDetail: (id) => axiosClient.get(`/classrooms/${id}/detail`),
  getMaterials: (id) => axiosClient.get(`/classrooms/${id}/materials`),
};

export default classroomAPI;