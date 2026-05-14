import apiClient from "./client";

export const getHomepageContent = async () => {
  const response = await apiClient.get("/homepage");
  return response.data?.data;
};
