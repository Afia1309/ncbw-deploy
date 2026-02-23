import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// Attach access token to every request automatically
api.interceptors.request.use(
  (config) => {
   const token = localStorage.getItem("access_token");
   if (token) {
     config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh token if expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh_token");

        // ask backend for new access token
        const response = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          { refresh }
        );

        // save new token
        localStorage.setItem("access_token", response.data.access);

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error("Refresh failed — logging out");

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

