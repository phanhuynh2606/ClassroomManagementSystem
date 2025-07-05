import axios from 'axios';

// Create axios instance with base URL
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true // Important for cookies
});

// Add token to requests if it exists
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    let errorData = error.response?.data;
    let errorCode = null;

    // Handle case where response.data is a Blob (when responseType: 'blob')
    if (errorData instanceof Blob && errorData.type === 'application/json') {
      try {
        const text = await errorData.text();
        errorData = JSON.parse(text);
        errorCode = errorData?.code;
      } catch (parseError) {
        console.warn('Failed to parse error blob:', parseError);
      }
    } else {
      errorCode = errorData?.code;
    }

    console.log("errorCode", errorCode, "errorData", errorData);
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry && (errorCode === 'ACCESS_TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN')) {
      originalRequest._retry = true;
      console.log("originalRequest", originalRequest)
      try {
        // Call refresh token endpoint
        const response = await axiosClient.post('/auth/refresh-token');
        const newToken = response.accessToken;

        if (newToken) {
          // Update token in localStorage
          localStorage.setItem('token', newToken);

          // Update Authorization header for subsequent requests
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          // Update the original request's Authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        if (refreshError.response?.data?.code === "REFRESH_TOKEN_EXPIRED" || refreshError.response?.data?.code === "NO_REFRESH_TOKEN") {
          localStorage.removeItem('token');
          localStorage.removeItem('persist:root');
          window.location.href = '/login';
        }
        // If refresh fails, redirect to login

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient; 