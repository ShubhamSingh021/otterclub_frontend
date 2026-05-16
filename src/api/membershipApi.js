import apiClient from "./client";

export const getPlans = async () => {
  const response = await apiClient.get("/membership/plans");
  return response.data;
};

export const getMyMembership = async () => {
  const response = await apiClient.get("/membership/my");
  return response.data;
};

export const getMembershipHistory = async () => {
  const response = await apiClient.get("/membership/history");
  return response.data;
};

export const createMembershipOrder = async (planType, extra = {}) => {
  const response = await apiClient.post("/membership/create-order", { planType, ...extra });
  return response.data;
};

export const verifyMembershipPayment = async (data) => {
  const response = await apiClient.post("/membership/verify-payment", data);
  return response.data;
};

// Admin APIs
export const getAllMemberships = async (params = {}) => {
  const response = await apiClient.get("/admin/memberships", { params });
  return response.data;
};

export const updateMembershipStatus = async (id, status) => {
  const response = await apiClient.patch(`/admin/memberships/${id}/status`, { status });
  return response.data;
};

export const extendMembership = async (id, days) => {
  const response = await apiClient.patch(`/admin/memberships/${id}/extend`, { days });
  return response.data;
};

export const deleteMembership = async (id) => {
  const response = await apiClient.delete(`/admin/memberships/${id}`);
  return response.data;
};

export const refundMembership = async (id) => {
  const response = await apiClient.patch(`/admin/memberships/${id}/refund`, {});
  return response.data;
};

export const resendConfirmationEmail = async (id) => {
  const response = await apiClient.post(`/admin/memberships/${id}/resend-email`, {});
  return response.data;
};
