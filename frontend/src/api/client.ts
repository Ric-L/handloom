import axios from "axios";
import { API_BASE_URL } from "../lib/constants";

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const isAdminPath = window.location.pathname.startsWith("/admin");
      if (isAdminPath && window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      } else if (!isAdminPath && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;
