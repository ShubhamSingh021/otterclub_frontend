import apiClient from "./client";

export const getPlans = async () => {
  const response = await apiClient.get("/plans");
  return response.data;
};

export const getAdminPlans = async () => {
  const response = await apiClient.get("/plans/admin");
  return response.data;
};

export const createPlan = async (planData) => {
  const response = await apiClient.post("/plans", planData);
  return response.data;
};

export const updatePlan = async (id, planData) => {
  const response = await apiClient.put(`/plans/${id}`, planData);
  return response.data;
};

export const deletePlan = async (id) => {
  const response = await apiClient.delete(`/plans/${id}`);
  return response.data;
};
