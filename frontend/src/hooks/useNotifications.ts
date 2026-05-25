import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchNotifications,
  getNotificationSocket,
  markAllNotificationsRead,
  markNotificationRead,
  RoleLinkNotification,
} from "@/services/notification";
import { useAuth } from "@/hooks/useAuth";

export const useNotifications = (options: { showToasts?: boolean } = {}) => {
  const showToasts = options.showToasts ?? true;
  const { isAuthenticated, role } = useAuth();
  const [notifications, setNotifications] = useState<RoleLinkNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const data = await fetchNotifications();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount ?? (data.notifications || []).filter((item) => !item.read).length);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    let cancelled = false;
    loadNotifications().catch(() => null);

    const interval = window.setInterval(() => {
      loadNotifications().catch(() => null);
    }, 20000);

    const socket = getNotificationSocket();
    const handleNewNotification = (notification: RoleLinkNotification) => {
      if (cancelled) return;
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
      setUnreadCount((count) => count + 1);

      if (showToasts && role === "jobseeker") {
        toast(notification.title || "Application update", {
          description: notification.message,
          className:
            notification.status === "Shortlisted"
              ? "border-emerald-500/40 bg-emerald-950 text-emerald-50"
              : "border-red-500/40 bg-red-950 text-red-50",
        });
      }
    };

    socket?.on("notification:new", handleNewNotification);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      socket?.off("notification:new", handleNewNotification);
    };
  }, [isAuthenticated, loadNotifications, role, showToasts]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loadNotifications, markRead, markAllRead };
};
