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
  create: (data) => axiosClient.post('/questions', data),
  update: (id, data) => axiosClient.put(`/questions/${id}`, data),
  delete: (id) => axiosClient.delete(`/admin/questions/${id}`),
};

export default questionAPI; 