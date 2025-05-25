import axiosClient from '../axiosClient';

const questionAPI = {
  getAll: (page, limit, search) => axiosClient.get('/admin/questions', {
    params: {
      page,
      limit,
      search,
    }
  }),
  getById: (id) => axiosClient.get(`/questions/${id}`),
  create: (data) => axiosClient.post('/questions', data),
  update: (id, data) => axiosClient.put(`/questions/${id}`, data),
  delete: (id) => axiosClient.delete(`/questions/${id}`),
};

export default questionAPI; 