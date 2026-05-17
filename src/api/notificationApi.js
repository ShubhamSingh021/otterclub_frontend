import API from "./client";

export const getNotifications = () => API.get("/notifications");
export const markAllNotificationsAsRead = () => API.put("/notifications/read-all");
export const markNotificationAsRead = (id) => API.put(`/notifications/${id}/read`);
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);
export const broadcastAnnouncement = (broadcastData) => API.post("/notifications/admin/broadcast", broadcastData);
