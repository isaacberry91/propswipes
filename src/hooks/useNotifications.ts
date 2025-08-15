import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize notifications when user is authenticated
      notificationService.initialize();
      // Also try to register any existing token with the new user session
      notificationService.registerCurrentToken();
    } else {
      // Remove push token when user signs out
      notificationService.removePushToken();
    }
  }, [user]);

  return {
    sendMessageNotification: notificationService.sendMessageNotification.bind(notificationService)
  };
};