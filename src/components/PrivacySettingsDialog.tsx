import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Eye, EyeOff, Users, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PrivacySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'matches_only' | 'private';
  show_location: boolean;
  show_phone: boolean;
  show_email: boolean;
  allow_messages_from: 'everyone' | 'matches_only' | 'none';
  show_online_status: boolean;
}

export const PrivacySettingsDialog = ({ open, onOpenChange }: PrivacySettingsDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    show_location: true,
    show_phone: false,
    show_email: false,
    allow_messages_from: 'matches_only',
    show_online_status: true,
  });

  useEffect(() => {
    if (open && user) {
      fetchPrivacySettings();
    }
  }, [open, user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user's profile ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (profile) {
        // Fetch existing privacy settings
        const { data: privacySettings } = await supabase
          .from('privacy_settings')
          .select('*')
          .eq('profile_id', profile.id)
          .single();
          
        if (privacySettings) {
          setSettings({
            profile_visibility: privacySettings.profile_visibility as 'public' | 'matches_only' | 'private',
            show_location: privacySettings.show_location,
            show_phone: privacySettings.show_phone,
            show_email: privacySettings.show_email,
            allow_messages_from: privacySettings.allow_messages_from as 'everyone' | 'matches_only' | 'none',
            show_online_status: privacySettings.show_online_status,
          });
        }
        // If no privacy settings exist, default values are already set in useState
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Get user's profile ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (profile) {
        // Upsert privacy settings (insert or update)
        const { error } = await supabase
          .from('privacy_settings')
          .upsert({
            profile_id: profile.id,
            profile_visibility: settings.profile_visibility,
            show_location: settings.show_location,
            show_phone: settings.show_phone,
            show_email: settings.show_email,
            allow_messages_from: settings.allow_messages_from,
            show_online_status: settings.show_online_status,
          });
          
        if (error) throw error;
        
        toast({
          title: "Privacy settings updated",
          description: "Your privacy preferences have been saved successfully.",
        });
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Settings
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Visibility */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4" />
                <h4 className="font-medium">Profile Visibility</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Control who can see your profile information
              </p>
              <Select 
                value={settings.profile_visibility} 
                onValueChange={(value: 'public' | 'matches_only' | 'private') => 
                  handleSettingChange('profile_visibility', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Public - Anyone can see</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="matches_only">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>Matches Only - Only matched users</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      <span>Private - Hidden from search</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Card>

            {/* Contact Information */}
            <Card className="p-4">
              <h4 className="font-medium mb-4">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <Label htmlFor="show-location" className="text-sm">
                      Show location
                    </Label>
                  </div>
                  <Switch
                    id="show-location"
                    checked={settings.show_location}
                    onCheckedChange={(checked) => handleSettingChange('show_location', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <Label htmlFor="show-phone" className="text-sm">
                      Show phone number
                    </Label>
                  </div>
                  <Switch
                    id="show-phone"
                    checked={settings.show_phone}
                    onCheckedChange={(checked) => handleSettingChange('show_phone', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <Label htmlFor="show-email" className="text-sm">
                      Show email address
                    </Label>
                  </div>
                  <Switch
                    id="show-email"
                    checked={settings.show_email}
                    onCheckedChange={(checked) => handleSettingChange('show_email', checked)}
                  />
                </div>
              </div>
            </Card>

            {/* Messaging Preferences */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Messaging</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Control who can send you messages
              </p>
              <Select 
                value={settings.allow_messages_from} 
                onValueChange={(value: 'everyone' | 'matches_only' | 'none') => 
                  handleSettingChange('allow_messages_from', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="matches_only">Matches Only</SelectItem>
                  <SelectItem value="none">No one</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            {/* Online Status */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Online Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Show when you're active
                  </p>
                </div>
                <Switch
                  checked={settings.show_online_status}
                  onCheckedChange={(checked) => handleSettingChange('show_online_status', checked)}
                />
              </div>
            </Card>

            <Separator />

            {/* Privacy Notice */}
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Your Privacy Matters</h4>
                  <p className="text-sm text-blue-700">
                    These settings help you control your privacy. You can change them anytime.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSettings} 
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};