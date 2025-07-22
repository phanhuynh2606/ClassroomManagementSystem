import axiosClient from '../axiosClient';

export const getTeacherDashboard = () => {
  return axiosClient.get('/teacher-dashboard');
};
