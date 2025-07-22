
import axiosClient from '../axiosClient';
const materialAPI = {
  createMaterial: (classroomId, formData) =>
    axiosClient.post(`/materials/teacher/${classroomId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  createMaterialInLibrary: (formData) =>
    axiosClient.post(`/materials/teacher/library`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),



  downloadMaterial: (materialId) =>
    axiosClient.get(`/materials/download/${materialId}`, {
      responseType: 'blob'
    }),

  deleteMaterial: (classroomId, materialId) =>
    axiosClient.delete(`/materials/teacher/${classroomId}/${materialId}`),

  getMaterials: (classroomId) =>
    axiosClient.get(`/materials/classroom/${classroomId}`),

  getMaterialByTeacher: () =>
    axiosClient.get('/materials'),

  shareMaterial: (materialId, classroomId) =>
    axiosClient.put(`/materials/${materialId}`, { classroomId }),

  updateMaterial: (materialId, data) =>
    axiosClient.put(`/materials/teacher/${materialId}`, data)
};

export default materialAPI;