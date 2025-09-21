// /contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";

export type Notification = {
  id: string;
  message: string;
  teamLogo?: string | number;
};

type NotificationContextType = {
  notifications: Notification[];
  showNotification: (notif: Notification) => void;
  onDismiss: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notif: Notification) => {
    setNotifications((prev) => [...prev, notif]);
  }, []);

  const onDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, showNotification, onDismiss }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
