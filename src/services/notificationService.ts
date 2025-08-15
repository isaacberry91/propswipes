import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  type: 'message';
  fromUserId: string;
  fromUserName: string;
  propertyTitle?: string;
  matchId: string;
}

class NotificationService {
  private initialized = false;
  private currentToken: string | null = null;

  async initialize() {
    console.log('📱 === NOTIFICATION SERVICE INITIALIZE START ===');
    console.log('📱 NotificationService.initialize() called');
    console.log('📱 Platform check - isNativePlatform:', Capacitor.isNativePlatform());
    console.log('📱 Platform:', Capacitor.getPlatform());
    console.log('📱 Already initialized:', this.initialized);
    
    // Force re-initialization for debugging
    console.log('📱 FORCING INITIALIZATION FOR DEBUGGING');
    
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Not a native platform, exiting');
      return;
    }

    try {
      console.log('📱 Setting up listeners first...');
      // Set up listeners BEFORE registration
      this.setupListeners();
      this.setupNativeListeners();
      
      
      console.log('📱 Requesting push notification permissions...');
      // Request permission to use push notifications
      const permission = await PushNotifications.requestPermissions();
      console.log('📱 Permission result:', permission);
      console.log('📱 Permission receive:', permission.receive);
      console.log('📱 Full permission object:', JSON.stringify(permission));
      
      if (permission.receive === 'granted') {
        console.log('📱 Permission granted, registering for push notifications...');
        
        // Add a small delay to ensure listeners are properly set up
        console.log('📱 Waiting 100ms before registration...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('📱 About to call PushNotifications.register()...');
        // Register with Apple / Google to receive push via APNS/FCM
        try {
          await PushNotifications.register();
          console.log('📱 PushNotifications.register() completed successfully');
          
          // Wait a bit to see if registration listener fires
          console.log('📱 Waiting 2 seconds to see if registration listener fires...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('📱 2 second wait completed. Did registration listener fire?');
          
        } catch (registerError) {
          console.error('📱 Error during PushNotifications.register():', registerError);
        }
        
        this.initialized = true;
        console.log('📱 Push notifications initialized successfully');
      } else {
        console.log('📱 Push notification permission denied:', permission);
        console.log('📱 Permission receive value was:', permission.receive);
      }
    } catch (error) {
      console.error('📱 Error initializing push notifications:', error);
      console.error('📱 Error stack:', error.stack);
    }
  }

  private setupListeners() {
    console.log('📱 Setting up push notification listeners...');
    
    // On success, register the token with your backend
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('📱 === PUSH REGISTRATION SUCCESS ===');
      console.log('📱 Full token object:', token);
      console.log('📱 Token value:', token.value);
      console.log('📱 Token value type:', typeof token.value);
      console.log('📱 Token value exists:', !!token.value);
      console.log('📱 MOBILE APP PUSH TOKEN:', token.value);
      console.log('📱 Token length:', token.value?.length);
      console.log('📱 === END TOKEN INFO ===');
      
      if (token.value) {
        this.currentToken = token.value;
        await this.registerTokenWithBackend(token.value);
      } else {
        console.error('📱 Token value is empty or undefined!');
      }
    });

    // Some issue with the registration
    PushNotifications.addListener('registrationError', (error) => {
      console.error('📱 Error on registration:', error);
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('📱 Push received:', notification);
      
      // You could show a toast notification here for foreground messages
      this.handleForegroundNotification(notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('📱 Push action performed:', notification);
      this.handleNotificationTap(notification);
    });
  }

  private setupNativeListeners() {
    console.log('📱 Setting up native FCM listeners...');
    
    // Listen for FCM token from native side (iOS AppDelegate)
    window.addEventListener('FCMTokenReceived', (event: any) => {
      console.log('📱 === FCM TOKEN RECEIVED FROM NATIVE ===');
      const fcmToken = event.detail?.token;
      console.log('📱 FCM Token:', fcmToken);
      
      if (fcmToken) {
        this.currentToken = fcmToken;
        this.registerTokenWithBackend(fcmToken);
      } else {
        console.error('📱 FCM token is empty!');
      }
    });
    
    // Also listen for native notification events  
    window.addEventListener('capacitorDidRegisterForRemoteNotifications', (event: any) => {
      console.log('📱 Capacitor did register for remote notifications:', event);
    });
    
    window.addEventListener('capacitorDidFailToRegisterForRemoteNotifications', (event: any) => {
      console.error('📱 Capacitor did fail to register for remote notifications:', event);
    });
  }

  private async registerTokenWithBackend(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get the user's profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Store the push token for this user - use 'fcm' platform for FCM tokens
          const { error } = await supabase
            .from('user_push_tokens')
            .upsert({ 
              user_id: profile.id, 
              push_token: token,
              platform: 'fcm', // Always use 'fcm' for Firebase Cloud Messaging
              created_at: new Date().toISOString()
            }, { 
              onConflict: 'user_id,platform' 
            });

          if (error) {
            console.error('📱 Error storing push token:', error);
          } else {
            console.log('📱 Push token stored successfully');
          }
        }
      }
    } catch (error) {
      console.error('📱 Error registering token with backend:', error);
    }
  }

  private handleForegroundNotification(notification: PushNotificationSchema) {
    // Handle notification received while app is in foreground
    // You could show a toast or update the UI here
    const data = notification.data as NotificationData;
    
    if (data?.type === 'message') {
      // Could dispatch a custom event or update global state
      const event = new CustomEvent('newMessage', { 
        detail: { 
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          matchId: data.matchId
        } 
      });
      window.dispatchEvent(event);
    }
  }

  private handleNotificationTap(notification: ActionPerformed) {
    const data = notification.notification.data as NotificationData;
    
    if (data?.type === 'message' && data.matchId) {
      // Navigate to the chat screen
      window.location.href = `/chat/${data.matchId}`;
    }
  }

  async sendMessageNotification(recipientUserId: string, senderName: string, message: string, matchId: string, propertyTitle?: string) {
    try {
      // Call the edge function to send push notification
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          recipientUserId,
          notification: {
            title: `New message from ${senderName}`,
            body: propertyTitle ? `${message} - ${propertyTitle}` : message,
            data: {
              type: 'message',
              fromUserId: senderName,
              fromUserName: senderName,
              propertyTitle,
              matchId
            }
          }
        }
      });

      if (error) {
        console.error('📱 Error sending push notification:', error);
      }
    } catch (error) {
      console.error('📱 Error calling send push notification function:', error);
    }
  }

  async removePushToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get the user's profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const { error } = await supabase
            .from('user_push_tokens')
            .delete()
            .eq('user_id', profile.id)
            .eq('platform', Capacitor.getPlatform());

          if (error) {
            console.error('📱 Error removing push token:', error);
          }
        }
      }
    } catch (error) {
      console.error('📱 Error removing push token:', error);
    }
  }

  // Method to register token when user logs in
  async registerCurrentToken() {
    if (this.currentToken && Capacitor.isNativePlatform()) {
      console.log('📱 Registering current token with new user session');
      await this.registerTokenWithBackend(this.currentToken);
    }
  }
}

export const notificationService = new NotificationService();