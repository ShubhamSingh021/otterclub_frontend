import API from "./client";

export const validateCoupon = (code, appliesTo, itemId, originalPrice) => 
  API.post("/coupons/validate", { code, appliesTo, itemId, originalPrice });

export const getAdminCoupons = () => API.get("/coupons/admin/list");
export const getAdminCouponStats = () => API.get("/coupons/admin/stats");
export const createCoupon = (couponData) => API.post("/coupons/admin", couponData);
export const updateCoupon = (id, couponData) => API.put(`/coupons/admin/${id}`, couponData);
export const deleteCoupon = (id) => API.delete(`/coupons/admin/${id}`);
export const toggleCoupon = (id) => API.patch(`/coupons/admin/${id}/toggle`);
