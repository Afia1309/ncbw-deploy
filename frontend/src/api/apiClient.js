import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/", // Django backend
});


// Attach access token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Auto-refresh token if expired
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      try {
        const refresh = localStorage.getItem("refresh");

        // ask backend for new access token
        const res = await axios.post(
          "http://127.0.0.1:8000/api/auth/refresh/",
          { refresh }
        );

        // save new token
        localStorage.setItem("access", res.data.access);

        // retry original request
        error.config.headers.Authorization =
          `Bearer ${res.data.access}`;

        return api(error.config);

      } catch (err) {
        console.error("Refresh failed — logging out");

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
