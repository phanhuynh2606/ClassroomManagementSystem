import axiosClient from '../axiosClient';

const quizAPI = {
  getAll: (classroomId) => axiosClient.get(`/quizzes/${classroomId}`),
  getByClassroom: (classroomId) => axiosClient.get(`/quizzes/classroom/${classroomId}`),
  getById: (id) => axiosClient.get(`/quizzes/${id}`),
  create: (data) => axiosClient.post('/quizzes', data),
  update: (id, data) => axiosClient.put(`/quizzes/${id}`, data),
  delete: (id) => axiosClient.delete(`/quizzes/${id}`),
  changeVisibility: (id, data) => axiosClient.patch(`/quizzes/${id}/visibility`, data),
  takeQuiz: (quizId) => axiosClient.get(`/quizzes/${quizId}/take`),
  submit: (quizId, answers) => axiosClient.post(`/quizzes/${quizId}/submit`, answers),
};

export default quizAPI; 