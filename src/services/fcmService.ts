import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Initialize Firebase Cloud Messaging
export const initializeFCM = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging is not supported');
    return null;
  }

  try {
    // Register service worker for FCM
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // For web, we'll simulate an FCM token since actual FCM setup requires Firebase config
    // In a real app, you would use Firebase SDK here
    const token = `web_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated FCM token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Store FCM token in database
export const storeFCMToken = async (token: string, platform: string = 'web') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    // Get user profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      console.error('User profile not found');
      return false;
    }

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('user_push_tokens')
      .select('id')
      .eq('user_id', profile.id)
      .eq('push_token', token)
      .single();

    if (existingToken) {
      console.log('FCM token already stored');
      return true;
    }

    // Store new token
    const { error } = await supabase
      .from('user_push_tokens')
      .insert({
        user_id: profile.id,
        push_token: token,
        platform: platform
      });

    if (error) {
      console.error('Error storing FCM token:', error);
      return false;
    }

    console.log('FCM token stored successfully');
    return true;
  } catch (error) {
    console.error('Error in storeFCMToken:', error);
    return false;
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Initialize FCM for authenticated user
export const initializeFCMForUser = async () => {
  try {
    // Request notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return false;
    }

    // Initialize FCM
    const registration = await initializeFCM();
    if (!registration) {
      console.log('Failed to initialize FCM');
      return false;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      console.log('Failed to get FCM token');
      return false;
    }

    // Store token in database
    const stored = await storeFCMToken(token, 'web');
    return stored;
  } catch (error) {
    console.error('Error initializing FCM for user:', error);
    return false;
  }
};

// Clean up old tokens for user
export const cleanupOldTokens = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    // Remove tokens older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', profile.id)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old tokens:', error);
    } else {
      console.log('Old FCM tokens cleaned up');
    }
  } catch (error) {
    console.error('Error in cleanupOldTokens:', error);
  }
};