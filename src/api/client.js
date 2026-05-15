import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api/v1" 
    : "https://otterclub-backend.onrender.com/api/v1");

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true, // Allow cookies and auth headers to be sent cross-origin
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
