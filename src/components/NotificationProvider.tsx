import React from "react";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  // Initialize push notifications for authenticated users
  useNotifications();
  
  return <>{children}</>;
};