import axiosClient from '../axiosClient';

const questionAPI = {
  getAll: (page, limit, search, difficulty, category, status) => axiosClient.get('/admin/questions', {
    params: {
      page,
      limit,
      search,
      difficulty,
      category,
      status
    }
  }),
  getById: (id) => axiosClient.get(`/admin/questions/${id}`),
  createManual: (data) => axiosClient.post('/admin/questions-manual', data),
  createExcel: (data) => axiosClient.post('/admin/questions-excel', data),
  update: (id, data) => axiosClient.patch(`/admin/questions/${id}`, data),
  delete: (id) => axiosClient.delete(`/admin/questions/${id}`),
  downLoadTemplateExcel: () => axiosClient.get('/admin/download-excel', {
    responseType: 'blob'
  }),
  uploadImage: (data) => axiosClient.post('/admin/questions/image', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

export default questionAPI; 