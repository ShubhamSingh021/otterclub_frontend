import API from "./client";

export const createOrder = (registrationId) => API.post("/payments/create-order", { registrationId });
export const verifyPayment = (paymentData) => API.post("/payments/verify", paymentData);
export const getAllPayments = (token) => 
  API.get("/payments/admin/all", {
    headers: { Authorization: `Bearer ${token}` }
  });
