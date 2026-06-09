import api from "./api";

export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

export const markNotificationsRead = async () => {
  const response = await api.put("/notifications/read");
  return response.data;
};

export const clearNotifications = async () => {
  const response = await api.delete("/notifications");
  return response.data;
};
