import axiosClient from '../axiosClient';
const materialAPI = {
  createMaterial: (classroomId, formData) => 
    axiosClient.post(`/materials/teacher/${classroomId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  deleteMaterial: (classroomId, materialId) => 
    axiosClient.delete(`/materials/teacher/${classroomId}/${materialId}`),

  getMaterials: (classroomId) => 
    axiosClient.get(`/materials/classroom/${classroomId}`),
  
  updateMaterial: (classroomId, materialId, data) => 
    axiosClient.put(`/materials/teacher/${classroomId}/${materialId}`, data)
};

export default materialAPI;