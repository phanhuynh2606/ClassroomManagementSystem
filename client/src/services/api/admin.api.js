import axiosClient from '../axiosClient';
  
  // Get all users with optional role filter
const adminAPI = {
  getUsers: (role) => {
    const url = role ? `/admin/users?role=${role}` : '/users';
    return axiosClient.get(url);
  },
  verifyTeacher: (userId, verify) => {
    return axiosClient.put(`/admin/users/verified/${userId}`, { verified: verify });
  },

  updateUser: (userId, userData) => {
    console.log(userData)
    return axiosClient.put(`/admin/users/${userId}`, {
      userData: userData
    });
  }

}

export default adminAPI; 