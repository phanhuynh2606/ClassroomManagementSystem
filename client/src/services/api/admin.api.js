import axiosClient from '../axiosClient';
  
  // Get all users with optional role filter
const adminAPI = {
  getUsers: (role) => {
    const url = role ? `/admin/users?role=${role}` : '/users';
    return axiosClient.get(url);
  },
}

export default adminAPI; 