import apiClient from "./client.js";

/**
 * Get all published community posts
 * @param {Object} filters - Filter criteria (category, search, sort, featured)
 */
export const getCommunityPosts = async (filters = {}) => {
  const response = await apiClient.get("/community/posts", { params: filters });
  return response.data;
};

/**
 * Get single community post by slug
 * @param {string} slug - Unique post slug
 */
export const getCommunityPostBySlug = async (slug) => {
  const response = await apiClient.get(`/community/posts/${slug}`);
  return response.data;
};

/**
 * Toggle like on a community post
 * @param {string} id - Post ObjectId
 */
export const likePost = async (id) => {
  const response = await apiClient.post(`/community/posts/${id}/like`);
  return response.data;
};

/**
 * Post a new comment on a community post
 * @param {string} id - Post ObjectId
 * @param {string} content - Comment textual content
 */
export const commentOnPost = async (id, content) => {
  const response = await apiClient.post(`/community/posts/${id}/comment`, { content });
  return response.data;
};

/**
 * Delete a comment from a community post
 * @param {string} postId - Post ObjectId
 * @param {string} commentId - Comment ObjectId
 */
export const deleteComment = async (postId, commentId) => {
  const response = await apiClient.delete(`/community/posts/${postId}/comment/${commentId}`);
  return response.data;
};

/**
 * Get all community posts including drafts (Admin only)
 */
export const adminGetPosts = async () => {
  const response = await apiClient.get("/community/admin/posts");
  return response.data;
};

/**
 * Create a new community post (Admin only)
 * @param {FormData} formData - Multipart Form data with coverImage, galleryImages and fields
 */
export const adminCreatePost = async (formData) => {
  const response = await apiClient.post("/community", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Update an existing community post (Admin only)
 * @param {string} id - Post ObjectId
 * @param {FormData} formData - Multipart Form data
 */
export const adminUpdatePost = async (id, formData) => {
  const response = await apiClient.put(`/community/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Delete a community post (Admin only)
 * @param {string} id - Post ObjectId
 */
export const adminDeletePost = async (id) => {
  const response = await apiClient.delete(`/community/${id}`);
  return response.data;
};
