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
  getTeacherClassrooms: () => axiosClient.get('/classrooms/teacher'),
  createByTeacher: (data) => axiosClient.post('/classrooms/teacher', data),
  updateByTeacher: (id, data) => axiosClient.put(`/classrooms/teacher/${id}`, data),
  deleteByTeacher: (id) => axiosClient.delete(`/classrooms/teacher/${id}`),
  getStudentsByTeacher: (id) => axiosClient.get(`/classrooms/teacher/${id}/students`),

  // Student APIs
  getAllByStudent: () => axiosClient.get('/classrooms/student'),
  joinClassroom: (code) => axiosClient.post('/classrooms/student/join', { code }),
  leaveClassroom: (id) => axiosClient.delete(`/classrooms/student/${id}/leave`),

  // Ban student APIs
  banStudent: (classroomId, studentId, reason) => axiosClient.post(`/classrooms/${classroomId}/ban/${studentId}`, { reason }),
  unbanStudent: (classroomId, studentId) => axiosClient.post(`/classrooms/${classroomId}/unban/${studentId}`),
  getBannedStudents: (classroomId) => axiosClient.get(`/classrooms/${classroomId}/banned-students`),

  // Shared APIs
  getStudents: (id) => axiosClient.get(`/classrooms/${id}/students`),
  getById: (id) => axiosClient.get(`/classrooms/${id}`),
  getDetail: (id) => axiosClient.get(`/classrooms/${id}/detail`),
  getMaterials: (id) => axiosClient.get(`/classrooms/${id}/materials`),

  // Appearance/background management methods
  
  // Update classroom appearance (NO file upload - just settings)
  updateAppearance: (id, appearanceData) => {
    return axiosClient.post(`/classrooms/teacher/${id}/appearance`, appearanceData);
  },

  // Get available themes
  getAvailableThemes: () => {
    return axiosClient.get('/classrooms/teacher/themes');
  },

  // Reset classroom appearance to default
  resetAppearance: (id) => {
    return axiosClient.post(`/classrooms/teacher/${id}/appearance/reset`);
  },

  // Upload NEW background image to Cloudinary (ONLY when uploading new file)
  uploadBackgroundImage: (file) => {
    const formData = new FormData();
    formData.append('background', file);
    return axiosClient.post('/classrooms/teacher/background/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get classroom appearance settings
  getAppearance: (id) => {
    return axiosClient.get(`/classrooms/teacher/${id}/appearance`);
  },

  // Get class grades & statistics
  getGradesStatistics: (classroomId) => axiosClient.get(`/classrooms/${classroomId}/grades-statistics`),
};

export default classroomAPI;