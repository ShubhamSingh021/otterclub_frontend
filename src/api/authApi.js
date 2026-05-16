import apiClient from "./client";

export const login = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get("/auth/profile");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await apiClient.put("/auth/profile", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
