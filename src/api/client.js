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
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("token");
  
  if (config.url.includes("/admin") && adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

export default apiClient;
