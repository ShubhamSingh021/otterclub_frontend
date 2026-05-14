import apiClient from "./client.js";

export const getEvents = async (params) => {
  const response = await apiClient.get("/events", { params });
  return response.data;
};

export const getUpcomingEvents = async () => {
  const response = await apiClient.get("/events/upcoming");
  return response.data;
};

export const getFeaturedEvents = async () => {
  const response = await apiClient.get("/events/featured");
  return response.data;
};

export const getEventBySlug = async (slug) => {
  const response = await apiClient.get(`/events/${slug}`);
  return response.data;
};

// Admin actions
export const createEvent = async (eventData) => {
  const response = await apiClient.post("/events", eventData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateEvent = async (id, eventData) => {
  const response = await apiClient.put(`/events/${id}`, eventData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await apiClient.delete(`/events/${id}`);
  return response.data;
};

export const toggleEventVisibility = async (id) => {
  const response = await apiClient.patch(`/events/${id}/visibility`);
  return response.data;
};

export const toggleEventFeatured = async (id) => {
  const response = await apiClient.patch(`/events/${id}/featured`);
  return response.data;
};
