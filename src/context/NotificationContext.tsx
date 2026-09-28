import React, { createContext, useContext, useState, useEffect } from "react";

export interface AppNotification {
  id: string;
  type: "PROJECT_STATUS" | "INVOICE_GENERATED" | "SYSTEM";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId?: string;
  invoiceId?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("vasthusilpy_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (n: any) =>
              !n.message?.includes("crm_proj_") &&
              !n.message?.includes("INV-2026-001") &&
              !n.projectId?.startsWith("crm_proj_")
          );
        }
      }
      return DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vasthusilpy_notifications", JSON.stringify(notifications));
    } catch (e) {
      console.warn("Could not save notifications to localStorage", e);
    }
  }, [notifications]);

  // Listen to custom window events for cross-component triggers
  useEffect(() => {
    const handleNotifyEvent = (e: CustomEvent) => {
      if (e.detail) {
        addNotification(e.detail);
      }
    };
    window.addEventListener("vasthusilpy_notify" as any, handleNotifyEvent);
    return () => {
      window.removeEventListener("vasthusilpy_notify" as any, handleNotifyEvent);
    };
  }, []);

  const addNotification = (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

// Helper utility to emit notification from anywhere
export const triggerAppNotification = (
  typeOrTitle: "PROJECT_STATUS" | "INVOICE_GENERATED" | "SYSTEM" | string | { type?: any; title: string; message: string; projectId?: string; invoiceId?: string },
  titleOrMessage?: string,
  messageOrExtra?: string | { projectId?: string; invoiceId?: string },
  extra?: { projectId?: string; invoiceId?: string }
) => {
  let type: "PROJECT_STATUS" | "INVOICE_GENERATED" | "SYSTEM" = "SYSTEM";
  let title = "";
  let message = "";
  let extraData: any = {};

  if (typeof typeOrTitle === "object" && typeOrTitle !== null) {
    type = typeOrTitle.type || "SYSTEM";
    title = typeOrTitle.title || "";
    message = typeOrTitle.message || "";
    extraData = { projectId: typeOrTitle.projectId, invoiceId: typeOrTitle.invoiceId };
  } else if (typeof messageOrExtra === "string") {
    // 3 or 4 arguments: (type, title, message, extra)
    type = (typeOrTitle as any) || "SYSTEM";
    title = titleOrMessage || "";
    message = messageOrExtra;
    extraData = extra || {};
  } else {
    // 2 arguments: (title, message)
    title = String(typeOrTitle || "");
    message = titleOrMessage || "";
    extraData = (typeof messageOrExtra === "object" ? messageOrExtra : {}) || {};
  }

  const event = new CustomEvent("vasthusilpy_notify", {
    detail: {
      type,
      title,
      message,
      ...(extraData || {})
    }
  });
  window.dispatchEvent(event);
};
