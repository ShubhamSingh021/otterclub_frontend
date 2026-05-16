import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/membership`;
const ADMIN_API_URL = `${import.meta.env.VITE_API_URL}/admin/memberships`;

export const getPlans = async () => {
  const response = await axios.get(`${API_URL}/plans`);
  return response.data;
};

export const getMyMembership = async (token) => {
  const response = await axios.get(`${API_URL}/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getMembershipHistory = async (token) => {
  const response = await axios.get(`${API_URL}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createMembershipOrder = async (planType, token, extra = {}) => {
  const response = await axios.post(
    `${API_URL}/create-order`,
    { planType, ...extra },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const verifyMembershipPayment = async (paymentData, token) => {
  const response = await axios.post(`${API_URL}/verify-payment`, paymentData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Admin APIs
export const getAllMemberships = async (token, params = {}) => {
  const response = await axios.get(ADMIN_API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
};

export const updateMembershipStatus = async (id, status, token) => {
  const response = await axios.patch(
    `${ADMIN_API_URL}/${id}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const extendMembership = async (id, days, token) => {
  const response = await axios.patch(
    `${ADMIN_API_URL}/${id}/extend`,
    { days },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteMembership = async (id, token) => {
  const response = await axios.delete(`${ADMIN_API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const refundMembership = async (id, token) => {
  const response = await axios.patch(
    `${ADMIN_API_URL}/${id}/refund`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const resendConfirmationEmail = async (id, token) => {
  const response = await axios.post(
    `${ADMIN_API_URL}/${id}/resend-email`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
