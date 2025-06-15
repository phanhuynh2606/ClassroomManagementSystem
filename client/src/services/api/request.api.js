import axiosClient from '../axiosClient';

const requestAPI = {
  // Admin APIs
  getAllRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/requests?${query}`);
  },
  
  getPendingRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/requests/pending?${query}`);
  },
  
  approveRequest: (requestId, data = {}) => 
    axiosClient.post(`/requests/${requestId}/approve`, data),
  
  rejectRequest: (requestId, reason) => 
    axiosClient.post(`/requests/${requestId}/reject`, { reason }),

  // Teacher APIs
  getTeacherRequests: (teacherId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/requests/teacher/${teacherId}?${query}`);
  },
  
  getRequestsByTeacherAndClassroom: (teacherId, classroomId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/requests/teacher/${teacherId}/${classroomId}?${query}`);
  },
  
  cancelRequest: (requestId) => 
    axiosClient.delete(`/requests/${requestId}/cancel`),
  
  createRequest: (data) => 
    axiosClient.post('/requests', data),

  // Shared APIs
  getRequestsByClassroom: (classroomId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/requests/classroom/${classroomId}?${query}`);
  },
  
  getRequestDetails: (requestId) => 
    axiosClient.get(`/requests/${requestId}`),

  // Classroom specific approvals (alternative to generic)
  approveClassroomCreation: (classroomId, data = {}) =>
    axiosClient.put(`/classrooms/admin/${classroomId}/approve`, data),
  
  rejectClassroomCreation: (classroomId, reason) =>
    axiosClient.put(`/classrooms/admin/${classroomId}/reject`, { reason }),
  
  approveDeletionRequest: (classroomId, data = {}) =>
    axiosClient.put(`/classrooms/admin/${classroomId}/approve-deletion`, data),
  
  rejectDeletionRequest: (classroomId, reason) =>
    axiosClient.put(`/classrooms/admin/${classroomId}/reject-deletion`, { reason }),
  
  approveEditRequest: (classroomId, data = {}) =>
    axiosClient.put(`/classrooms/admin/${classroomId}/approve-edit`, data),
  
  rejectEditRequest: (classroomId, reason) =>
    axiosClient.put(`/classrooms/admin/${classroomId}/reject-edit`, { reason }),
};

export default requestAPI; 