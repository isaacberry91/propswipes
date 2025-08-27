import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Bell, BellOff, Smartphone, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
interface PushNotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PushNotificationsDialog = ({ open, onOpenChange }: PushNotificationsDialogProps) => {
  const { toast } = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isNative, setIsNative] = useState(false);
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      checkNotificationStatus();
      fetchPreferences();
    }
  }, [open]);

  const checkNotificationStatus = async () => {
    setIsNative(Capacitor.isNativePlatform());
    
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;
    try {
      // Get user profile ID first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;

      const { data: prefs, error } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (error) throw error;

      if (prefs) {
        const enabled = Boolean((prefs as any).match_notifications) && Boolean((prefs as any).message_notifications);
        setPushEnabled(enabled);
      }
    } catch (e) {
      console.error('Error loading push preferences:', e);
    }
  };

  const handleEnablePushNotifications = async () => {
    setIsSaving(true);
    try {
      if (!user) throw new Error('Not authenticated');

      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;

      // Save preference (enable)
      const { error: upsertError } = await supabase
        .from('notification_preferences' as any)
        .upsert({
          profile_id: profile.id,
          match_notifications: true,
          message_notifications: true,
        }, { onConflict: 'profile_id' });
      if (upsertError) throw upsertError;

      setPushEnabled(true);

      // Try to initialize push on native; on web, don't block saving
      if (Capacitor.isNativePlatform()) {
        try {
          setIsInitializing(true);
          await notificationService.initialize();
        } catch (err) {
          console.warn('Push init failed (non-fatal):', err);
        } finally {
          setIsInitializing(false);
        }
      }

      toast({
        title: 'Preferences saved',
        description: 'Push notifications enabled. On web, delivery may be limited.',
      });
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast({
        title: 'Error enabling',
        description: 'Could not save your preference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setIsSaving(true);
    try {
      if (!user) throw new Error('Not authenticated');

      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;

      // Save preference (disable)
      const { error: upsertError } = await supabase
        .from('notification_preferences' as any)
        .upsert({
          profile_id: profile.id,
          match_notifications: false,
          message_notifications: false,
        }, { onConflict: 'profile_id' });
      if (upsertError) throw upsertError;

      // Remove push token from backend (noop on web)
      await notificationService.removePushToken();
      setPushEnabled(false);

      toast({
        title: 'Preferences saved',
        description: 'Push notifications disabled.',
      });
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      toast({
        title: 'Error disabling',
        description: 'Could not save your preference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPermissionStatus = () => {
    switch (permissionStatus) {
      case 'granted':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Permission granted</span>
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Permission denied</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <Bell className="w-4 h-4" />
            <span className="text-sm">Permission not requested</span>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </DialogTitle>
          <DialogDescription>
            Manage your push notification preference. Saving works in browser; delivery requires the native app.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {pushEnabled ? (
                  <Bell className="w-5 h-5 text-green-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium">
                  {pushEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {renderPermissionStatus()}
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {pushEnabled 
                ? "You're receiving push notifications for messages and matches."
                : "Enable push notifications to stay updated on new messages and matches."
              }
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="push-toggle" className="text-sm font-medium">
                Push Notifications
              </Label>
              <Switch
                id="push-toggle"
                checked={pushEnabled}
                onCheckedChange={pushEnabled ? handleDisablePushNotifications : handleEnablePushNotifications}
                disabled={isInitializing || isSaving}
              />
            </div>
          </Card>

          {/* Native App Notice */}
          {isNative && (
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Mobile App</h4>
                  <p className="text-sm text-blue-700">
                    You're using the native mobile app. Push notifications are automatically optimized for your device.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* What you'll receive */}
          <div>
            <h4 className="font-medium mb-3">What you'll receive:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>New message notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>New match alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Property updates</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Browser instructions */}
          {permissionStatus === 'denied' && (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Re-enable in Browser</h4>
              <p className="text-sm text-amber-700">
                Push notifications were blocked. To re-enable them:
              </p>
              <ol className="text-sm text-amber-700 mt-2 ml-4 list-decimal space-y-1">
                <li>Click the lock icon in your address bar</li>
                <li>Set notifications to "Allow"</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};