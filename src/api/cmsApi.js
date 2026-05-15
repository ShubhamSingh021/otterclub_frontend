import apiClient from "./client";

export const updateHero = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return apiClient.post("/cms/hero", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const updateAbout = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return apiClient.post("/cms/about", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const updateSection = (key, data) => apiClient.post(`/cms/section/${key}`, data);

export const updateStats = (data) => apiClient.post("/cms/stats", data);

export const updateSettings = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (key === "contact" || key === "socialLinks" || key === "navigationLinks" || key === "globalCta") {
      formData.append(key, JSON.stringify(data[key]));
    } else {
      formData.append(key, data[key]);
    }
  });
  return apiClient.post("/cms/settings", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const getCMSStats = () => apiClient.get("/cms/stats-data");

// Testimonials
export const createTestimonial = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return apiClient.post("/cms/testimonials", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const updateTestimonial = (id, data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return apiClient.put(`/cms/testimonials/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const deleteTestimonial = (id) => apiClient.delete(`/cms/testimonials/${id}`);
