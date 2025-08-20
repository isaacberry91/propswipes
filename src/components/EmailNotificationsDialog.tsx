import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bell, Heart, MessageCircle, Home, Star, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface EmailNotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationPreferences {
  match_notifications: boolean;
  message_notifications: boolean;
  property_updates: boolean;
  marketing_emails: boolean;
  weekly_digest: boolean;
}

export const EmailNotificationsDialog = ({ open, onOpenChange }: EmailNotificationsDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    match_notifications: true,
    message_notifications: true,
    property_updates: true,
    marketing_emails: false,
    weekly_digest: true,
  });

  useEffect(() => {
    if (open && user) {
      fetchNotificationPreferences();
    }
  }, [open, user]);

  const fetchNotificationPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Check if notification preferences exist in profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          notification_preferences:notification_preferences(*)
        `)
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      // If preferences exist, use them; otherwise use defaults
      if (profile.notification_preferences && profile.notification_preferences.length > 0) {
        const prefs = profile.notification_preferences[0];
        setPreferences({
          match_notifications: prefs.match_notifications ?? true,
          message_notifications: prefs.message_notifications ?? true,
          property_updates: prefs.property_updates ?? true,
          marketing_emails: prefs.marketing_emails ?? false,
          weekly_digest: prefs.weekly_digest ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: "Error loading preferences",
        description: "Using default notification settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Get user profile ID first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Upsert notification preferences
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          profile_id: profile.id,
          match_notifications: preferences.match_notifications,
          message_notifications: preferences.message_notifications,
          property_updates: preferences.property_updates,
          marketing_emails: preferences.marketing_emails,
          weekly_digest: preferences.weekly_digest,
        }, {
          onConflict: 'profile_id'
        });
        
      if (error) throw error;
      
      toast({
        title: "Preferences saved",
        description: "Your email notification preferences have been updated."
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Email Notifications
          </DialogTitle>
          <DialogDescription>
            Choose which email notifications you'd like to receive
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activity Notifications */}
            <Card className="p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Activity Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">New Matches</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when you have a new property match
                    </p>
                  </div>
                  <Switch
                    checked={preferences.match_notifications}
                    onCheckedChange={(checked) => updatePreference('match_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">New Messages</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified about new chat messages
                    </p>
                  </div>
                  <Switch
                    checked={preferences.message_notifications}
                    onCheckedChange={(checked) => updatePreference('message_notifications', checked)}
                  />
                </div>
              </div>
            </Card>

            {/* Property Updates */}
            <Card className="p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-500" />
                Property Updates
              </h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Property Status Changes</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about price changes and status updates for properties you've liked
                  </p>
                </div>
                <Switch
                  checked={preferences.property_updates}
                  onCheckedChange={(checked) => updatePreference('property_updates', checked)}
                />
              </div>
            </Card>

            <Separator />

            {/* Promotional Content */}
            <Card className="p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Promotional & Updates
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Weekly Digest</Label>
                    <p className="text-xs text-muted-foreground">
                      Weekly summary of new properties in your area
                    </p>
                  </div>
                  <Switch
                    checked={preferences.weekly_digest}
                    onCheckedChange={(checked) => updatePreference('weekly_digest', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Marketing Emails</Label>
                    <p className="text-xs text-muted-foreground">
                      Tips, feature updates, and promotional offers
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketing_emails}
                    onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSavePreferences}
                className="flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};