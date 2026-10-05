import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token if present & auto-handle FormData
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // When sending FormData, delete Content-Type so Axios/browser sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh & Graceful Fallback
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized & Token Refresh Attempt
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          if (res.status === 200 && res.data.access) {
            const newAccessToken = res.data.access;
            localStorage.setItem('access_token', newAccessToken);
            if (res.data.refresh) {
              localStorage.setItem('refresh_token', res.data.refresh);
            }
            apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          // Token refresh failed - purge invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
