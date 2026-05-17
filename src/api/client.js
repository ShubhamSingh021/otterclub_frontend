import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api/v1" 
    : "https://otterclub-backend.onrender.com/api/v1");

const apiClient = axios.create({
  baseURL,
  timeout: 60000,
  withCredentials: true, // Allow cookies and auth headers to be sent cross-origin
});

apiClient.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("token");
  
  // Determine if this is an admin-level operation
  const isMutation = ["post", "put", "delete", "patch"].includes(config.method.toLowerCase());
  const isAdminPath = window.location.pathname.startsWith("/admin");
  
  // Routes that should always use admin token if available
  const isAdminApi = config.url.includes("/admin") || 
                    config.url.includes("/cms") ||
                    (config.url.includes("/plans") && isMutation) ||
                    (config.url.includes("/events") && isMutation);

  // Prioritize adminToken if we are in admin context or hitting an admin API
  if (adminToken && (isAdminPath || isAdminApi)) {
    console.log("Using Admin Token for:", config.url);
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (userToken) {
    console.log("Using User Token for:", config.url);
    config.headers.Authorization = `Bearer ${userToken}`;
  } else if (adminToken) {
    console.log("Fallback: Using Admin Token for:", config.url);
    // Fallback if no userToken but adminToken exists
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  
  return config;
});

export default apiClient;
