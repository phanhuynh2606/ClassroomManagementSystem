// Test script để kiểm tra API dashboard
const axios = require('axios');

const testDashboardAPI = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Thay thế bằng token admin thực
      }
    });

    console.log('Dashboard Stats Response:');
    console.log('=========================');
    console.log('Total Users:', response.data.data.totalUsers);
    console.log('Total Classrooms:', response.data.data.totalClassrooms);
    console.log('Total Assignments:', response.data.data.totalAssignments);
    console.log('Total Quizzes:', response.data.data.totalQuizzes);
    console.log('Total Questions:', response.data.data.totalQuestions);
    console.log('Total Storage (MB):', response.data.data.totalStorage);
    console.log('Recent Activities:', response.data.data.recentActivities?.length || 0, 'items');
    console.log('User Role Data:', response.data.data.userRoleData);
    console.log('Gender Data:', response.data.data.genderData);
    console.log('Age Distribution:', response.data.data.ageDistributionData);
    console.log('User Growth Data:', response.data.data.userGrowthData);
    console.log('Login Data:', response.data.data.loginData);

  } catch (error) {
    console.error('Error testing dashboard API:', error.response?.data || error.message);
  }
};

// Run test
console.log('Testing Dashboard API...');
testDashboardAPI();
