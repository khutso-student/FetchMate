import axios from "axios";

const API_BASE =import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

// Axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on unauthorized (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth services
export const signupUser = (data) => api.post("/users/signup/", data);
export const loginUser = (data) => api.post("/users/login/", data);

export const fetchVideoInfo = (url) =>
  api.post("/downloader/fetch/", { url });
