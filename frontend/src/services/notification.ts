import { apiFetch, getApiBaseUrl, getAuthToken } from "@/lib/api";
import { io, Socket } from "socket.io-client";

export type RoleLinkNotification = {
  id: string;
  _id?: string;
  type: "shortlisted" | "rejected" | "status_update" | "new_application";
  status?: "Shortlisted" | "Rejected";
  title?: string;
  message: string;
  detail?: string;
  jobTitle?: string;
  companyName?: string;
  emailSent?: boolean;
  read?: boolean;
  createdAt?: string;
};

let socket: Socket | null = null;

export const fetchNotifications = async () =>
  apiFetch<{ notifications: RoleLinkNotification[]; unreadCount?: number }>("/api/notifications");

export const markNotificationRead = async (notificationId: string) =>
  apiFetch<{ notification: RoleLinkNotification }>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });

export const markAllNotificationsRead = async () =>
  apiFetch<{ message: string }>("/api/notifications/read-all", {
    method: "PATCH",
  });

export const getNotificationSocket = () => {
  const token = getAuthToken();
  if (!token) return null;

  if (!socket) {
    socket = io(getApiBaseUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const disconnectNotificationSocket = () => {
  socket?.disconnect();
  socket = null;
};
