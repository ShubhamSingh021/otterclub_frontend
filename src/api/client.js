import axios from "axios";

const baseURL = 
  window.location.hostname === "localhost" 
    ? "http://localhost:5000/api/v1" 
    : (import.meta.env.VITE_API_BASE_URL || "https://otterclub-backend.onrender.com/api/v1");

const apiClient = axios.create({
  baseURL,
  timeout: 30000, // Increased timeout for file uploads
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
