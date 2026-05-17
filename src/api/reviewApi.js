import apiClient from "./client";

// Public APIs
export const getApprovedReviews = async () => {
  const response = await apiClient.get("/testimonials");
  return response.data;
};

// User APIs
export const getReviewEligibility = async () => {
  const response = await apiClient.get("/testimonials/eligibility");
  return response.data;
};

export const submitReview = async (reviewData) => {
  const response = await apiClient.post("/testimonials/submit", reviewData);
  return response.data;
};

export const getMyReviews = async () => {
  const response = await apiClient.get("/testimonials/my-reviews");
  return response.data;
};

export const updateMyReview = async (id, reviewData) => {
  const response = await apiClient.put(`/testimonials/my-reviews/${id}`, reviewData);
  return response.data;
};

export const deleteMyReview = async (id) => {
  const response = await apiClient.delete(`/testimonials/my-reviews/${id}`);
  return response.data;
};

// Admin APIs
export const getAdminReviews = async (params = {}) => {
  const response = await apiClient.get("/testimonials/admin/list", { params });
  return response.data;
};

export const updateReviewStatus = async (id, status) => {
  const response = await apiClient.patch(`/testimonials/admin/${id}/status`, { status });
  return response.data;
};

export const toggleReviewFeatured = async (id, featured) => {
  const response = await apiClient.patch(`/testimonials/admin/${id}/featured`, { featured });
  return response.data;
};

export const deleteReviewAdmin = async (id) => {
  const response = await apiClient.delete(`/testimonials/${id}`);
  return response.data;
};
