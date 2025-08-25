import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield, 
  Star,
  Crown,
  Edit2,
  Camera,
  Smartphone,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  LogOut,
  Home,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PropertyManager from "@/components/PropertyManager";
import { TwoFactorSetupDialog } from "@/components/TwoFactorSetupDialog";
import { ActiveSessionsDialog } from "@/components/ActiveSessionsDialog";
import { EmailNotificationsDialog } from "@/components/EmailNotificationsDialog";
import { PushNotificationsDialog } from "@/components/PushNotificationsDialog";
import { PrivacySettingsDialog } from "@/components/PrivacySettingsDialog";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscription, loading, hasUnlimitedLikes, canListProperties, hasAdvancedFilters, hasAnalytics } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  const [activeSessionsDialogOpen, setActiveSessionsDialogOpen] = useState(false);
  const [emailNotificationsDialogOpen, setEmailNotificationsDialogOpen] = useState(false);
  const [pushNotificationsDialogOpen, setPushNotificationsDialogOpen] = useState(false);
  const [privacySettingsDialogOpen, setPrivacySettingsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Try to get active profile (RLS hides soft-deleted rows)
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) throw error;

      if (!data) {
        // Attempt to reactivate if a soft-deleted row exists
        await supabase
          .from('profiles')
          .update({ deleted_at: null })
          .eq('user_id', user.id);

        const { data: reFetched } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (reFetched) {
          setUserProfile(reFetched);
          return;
        }

        // Create a fresh profile if still missing
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: (user.user_metadata as any)?.display_name || user.email?.split('@')[0] || null,
            user_type: (user.user_metadata as any)?.user_type || 'buyer',
            phone: (user.user_metadata as any)?.phone || null,
            location: (user.user_metadata as any)?.location || null,
          })
          .select('*')
          .single();

        if (insertError) {
          // If conflict (already exists), just fetch again
          const { data: finalFetch } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          if (finalFetch) setUserProfile(finalFetch);
        } else {
          setUserProfile(created);
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Calculate usage based on subscription
  const getMaxProperties = () => {
    if (!subscription.isActive) return 1;
    switch (subscription.tier) {
      case 'seller_basic': return 5;
      case 'seller_professional': return 25;
      case 'seller_enterprise': return 999;
      default: return 1;
    }
  };

  const getMaxDailyLikes = () => {
    return hasUnlimitedLikes() ? 999 : 10;
  };

  const getTierDisplayName = () => {
    switch (subscription.tier) {
      case 'buyer_pro': return 'Buyer Pro';
      case 'seller_basic': return 'Seller Basic';
      case 'seller_professional': return 'Seller Professional';
      case 'seller_enterprise': return 'Seller Enterprise';
      default: return 'Free';
    }
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;
    
    try {
      console.log('🔄 Profile: Saving profile data:', userProfile);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: userProfile.display_name,
          bio: userProfile.bio,
          location: userProfile.location,
          phone: userProfile.phone,
        })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      console.log('✅ Profile: Profile updated successfully');
      
      // Refresh the profile data after successful save
      await fetchUserProfile();
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        duration: 5000
      });
    } catch (error) {
      console.error('❌ Profile: Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleSubscriptionManage = () => {
    toast({
      title: "Mobile App Required 📱",
      description: "Subscription management is only available in the mobile app. Download from your app store!",
      duration: 5000
    });
  };

  const handleUpgradePlan = () => {
    navigate('/subscription');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
        duration: 5000
      });
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error logging out",
        description: "Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed."
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error changing password",
        description: error.message || "Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  const handleTwoFactorSuccess = () => {
    // Refresh user profile to get updated 2FA status
    fetchUserProfile();
    toast({
      title: "2FA Enabled",
      description: "Two-factor authentication has been successfully enabled for your account."
    });
  };

  const handleDisable2FA = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          two_factor_enabled: false,
          two_factor_method: null,
          two_factor_contact: null
        })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Refresh profile to show updated status
      fetchUserProfile();
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account."
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error disabling 2FA",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error calling delete function:', error);
        throw new Error(error.message || 'Failed to delete account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Account deactivated successfully",
        description: data?.message || "Your account has been deactivated. Contact support to reactivate.",
        duration: 5000
      });
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error deleting account",
        description: error.message || "Please try again or contact support if the issue persists.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !file) return;
    
    try {
      setUploadingAvatar(true);
      console.log('📷 Profile: Starting avatar upload for file:', file.name);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      console.log('📷 Profile: Uploading file as:', fileName);
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('❌ Profile: Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('📷 Profile: File uploaded successfully:', uploadData);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      console.log('📷 Profile: Public URL generated:', publicUrl);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error('❌ Profile: Database update error:', updateError);
        throw updateError;
      }
      
      console.log('✅ Profile: Database updated with new avatar URL');
      
      // Refresh profile data to ensure it persists
      await fetchUserProfile();
      
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
        duration: 5000
      });
    } catch (error) {
      console.error('❌ Profile: Error uploading avatar:', error);
      toast({
        title: "Error uploading photo",
        description: "Please try again later.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const triggerFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleAvatarUpload(file);
      }
    };
    input.click();
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    try {
      setUploadingAvatar(true);
      
      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setUserProfile(prev => ({ ...prev, avatar_url: null }));
      
      toast({
        title: "Profile photo removed",
        description: "Your profile photo has been successfully removed.",
        duration: 5000
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Error removing photo",
        description: "Please try again later.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Account Dashboard</h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-2">Manage your professional real estate profile</p>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            className="flex items-center gap-2 self-start sm:self-center"
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6 lg:space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-card border border-border rounded-lg overflow-hidden h-12 lg:h-14">
            <TabsTrigger value="profile" className="flex items-center justify-center px-1 sm:px-2 lg:px-4 py-2 text-[10px] sm:text-xs lg:text-sm">
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center justify-center px-1 sm:px-2 lg:px-4 py-2 text-[10px] sm:text-xs lg:text-sm">
              <span>Properties</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center justify-center px-1 sm:px-2 lg:px-4 py-2 text-[10px] sm:text-xs lg:text-sm">
              <span>Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center justify-center px-1 sm:px-2 lg:px-4 py-2 text-[10px] sm:text-xs lg:text-sm">
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center justify-center px-1 sm:px-2 lg:px-4 py-2 text-[10px] sm:text-xs lg:text-sm">
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Professional Profile Tab */}
          <TabsContent value="profile">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/10 shadow-2xl">
              {/* Floating Background Elements */}
              <div className="absolute top-8 right-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl animate-pulse"></div>
              <div className="absolute bottom-8 left-8 h-28 w-28 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-2xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-gradient-to-r from-primary/5 to-secondary/5 blur-3xl"></div>
              
                <div className="relative z-10 p-4 sm:p-6 lg:p-8 xl:p-10">
                 {/* Elegant Header */}
                 <div className="mb-6 lg:mb-8">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20">
                       <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                     </div>
                     <div>
                       <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                         Professional Profile
                       </h2>
                       <p className="text-muted-foreground text-sm lg:text-base xl:text-lg mt-1">
                         Manage your professional real estate credentials
                       </p>
                     </div>
                   </div>
                 </div>

                  {/* Main Profile Section - Mobile-first layout */}
                  <div className="w-full">
                    <div className="space-y-6">
                      {/* Avatar and Status Section */}
                      <div className="flex flex-col items-center space-y-4">
                       <div className="relative group">
                         <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                         <div className="relative">
                           <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-2xl ring-4 ring-primary/10">
                             <AvatarImage src={userProfile?.avatar_url} />
                             <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                               {userProfile?.display_name?.[0] || user?.email?.[0] || 'U'}
                             </AvatarFallback>
                           </Avatar>
                           {isEditing && (
                             <div className="absolute -bottom-2 -right-2 flex gap-2">
                               <Button
                                 size="sm"
                                 className="rounded-full h-10 w-10 p-0 shadow-lg bg-primary hover:bg-primary/90 border-2 border-background"
                                 onClick={triggerFileUpload}
                                 disabled={uploadingAvatar}
                               >
                                 <Camera className="w-4 h-4" />
                               </Button>
                               {userProfile?.avatar_url && (
                                 <Button
                                   size="sm"
                                   variant="destructive"
                                   className="rounded-full h-10 w-10 p-0 shadow-lg border-2 border-background"
                                   onClick={handleRemoveAvatar}
                                   disabled={uploadingAvatar}
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                       
                       <div className="text-center space-y-3 w-full">
                         <div>
                           <h3 className="text-xl font-bold text-foreground mb-2">
                             {userProfile?.display_name || user?.email?.split('@')[0]}
                           </h3>
                           <p className="text-muted-foreground font-medium text-sm break-all">{user?.email}</p>
                         </div>
                         
                         <div className="flex flex-wrap justify-center gap-2">
                           <Badge variant={subscription.isActive ? "default" : "secondary"} className="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                             {subscription.isActive ? <Crown className="w-3 h-3 mr-1.5" /> : <Star className="w-3 h-3 mr-1.5" />}
                             {getTierDisplayName()}
                           </Badge>
                           <Badge variant="outline" className="capitalize px-3 py-1.5 rounded-full border-primary/30 text-primary bg-primary/5 shadow-sm text-xs">
                             {userProfile?.user_type || 'buyer'}
                           </Badge>
                         </div>
                       </div>
                     </div>

                      {/* Form Fields Section */}
                      <div className="space-y-6">
                        <div className="space-y-6">
                         {/* Form Grid - Single column for mobile */}
                         <div className="space-y-4">
                           <div className="space-y-2">
                             <Label htmlFor="displayName" className="text-sm font-semibold text-foreground flex items-center gap-2">
                               <User className="w-4 h-4 text-primary" />
                               Display Name
                             </Label>
                             <div className="relative group">
                               <Input
                                 id="displayName"
                                 value={userProfile?.display_name || ''}
                                 onChange={(e) => setUserProfile({...userProfile, display_name: e.target.value})}
                                 disabled={!isEditing}
                                 className="rounded-xl border-2 border-primary/20 bg-background/80 backdrop-blur-sm focus:border-primary/40 focus:bg-background transition-all duration-300 shadow-sm h-11"
                                 maxLength={50}
                               />
                               <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                             </div>
                           </div>
                           
                           <div className="space-y-2">
                             <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                               <AlertCircle className="w-4 h-4 text-muted-foreground" />
                               Email
                             </Label>
                             <Input
                               id="email"
                               type="email"
                               value={user?.email || ''}
                               disabled={true}
                               className="rounded-xl bg-muted/60 border-muted-foreground/20 shadow-sm h-11"
                               title={user?.email || ''}
                             />
                           </div>
                           
                           <div className="space-y-2">
                             <Label htmlFor="phone" className="text-sm font-semibold text-foreground flex items-center gap-2">
                               <Smartphone className="w-4 h-4 text-primary" />
                               Phone
                             </Label>
                             <div className="relative group">
                               <Input
                                 id="phone"
                                 value={userProfile?.phone || ''}
                                 onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                                 disabled={!isEditing}
                                 placeholder="Phone number"
                                 className="rounded-xl border-2 border-primary/20 bg-background/80 backdrop-blur-sm focus:border-primary/40 focus:bg-background transition-all duration-300 shadow-sm h-11"
                               />
                               <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                             </div>
                           </div>
                        </div>
                        
                         {/* Location - Full width */}
                         <div className="space-y-2">
                           <Label htmlFor="location" className="text-sm font-semibold text-foreground flex items-center gap-2">
                             <Home className="w-4 h-4 text-primary" />
                             Location
                           </Label>
                           <div className="relative group">
                             <Input
                               id="location"
                               value={userProfile?.location || ''}
                               onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                               disabled={!isEditing}
                               placeholder="Your location"
                               className="rounded-xl border-2 border-primary/20 bg-background/80 backdrop-blur-sm focus:border-primary/40 focus:bg-background transition-all duration-300 shadow-sm h-11"
                              maxLength={100}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        </div>
                        
                        {/* Bio - Full width */}
                        <div className="space-y-2 lg:space-y-3">
                          <Label htmlFor="bio" className="text-sm lg:text-base font-semibold text-foreground flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-primary" />
                            Bio
                          </Label>
                          <div className="relative group">
                            <textarea
                              id="bio"
                              className="w-full min-h-[100px] lg:min-h-[120px] xl:min-h-[140px] p-4 lg:p-5 border-2 border-primary/20 rounded-xl bg-background/80 backdrop-blur-sm text-foreground disabled:opacity-50 resize-none focus:border-primary/40 focus:bg-background transition-all duration-300 shadow-sm text-sm lg:text-base"
                              value={userProfile?.bio || ''}
                              onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                              disabled={!isEditing}
                              placeholder="Tell others about yourself..."
                              maxLength={150}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                          <div className="flex justify-between items-center text-xs lg:text-sm">
                            <span className="text-muted-foreground">Share your professional story</span>
                            <span className={`font-medium transition-colors duration-300 ${
                              (userProfile?.bio?.length || 0) > 140 ? 'text-destructive' : 
                              (userProfile?.bio?.length || 0) > 120 ? 'text-yellow-600' : 'text-muted-foreground'
                            }`}>
                              {userProfile?.bio?.length || 0}/150 characters
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        {isEditing && (
                          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-4 lg:pt-6">
                            <Button 
                              onClick={handleSave}
                              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 h-11 lg:h-12 text-sm lg:text-base"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditing(false)}
                              className="flex-1 rounded-xl border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-11 lg:h-12 text-sm lg:text-base"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          {/* Properties Tab */}
          <TabsContent value="properties">
            <PropertyManager />
          </TabsContent>

          {/* Subscription Tab */}
           <TabsContent value="subscription">
             <div className="space-y-6">
               {/* Current Plan */}
               <Card className="p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-semibold text-foreground">Current Plan</h3>
                   <Badge 
                     variant={subscription.isActive ? "default" : "secondary"}
                     className={subscription.isActive ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}
                   >
                     {subscription.isActive ? "Active" : "Free"}
                   </Badge>
                 </div>
                 
                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                       subscription.isActive ? "bg-blue-500" : "bg-gray-400"
                     }`}>
                       {subscription.isActive ? <Crown className="w-6 h-6 text-white" /> : <Star className="w-6 h-6 text-white" />}
                     </div>
                     <div>
                       <h4 className="font-semibold text-foreground">{getTierDisplayName()}</h4>
                       <p className="text-sm text-muted-foreground">
                         {subscription.isActive && subscription.subscriptionEnd 
                           ? `Active until ${new Date(subscription.subscriptionEnd).toLocaleDateString()}`
                           : "Free tier with basic features"
                         }
                       </p>
                     </div>
                   </div>
                   
                   {subscription.isActive && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                       <div>
                         <p className="text-sm text-muted-foreground">Subscription End</p>
                         <p className="font-medium text-foreground">
                           {subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString() : 'N/A'}
                         </p>
                       </div>
                       <div>
                         <p className="text-sm text-muted-foreground">Status</p>
                         <p className="font-medium text-foreground capitalize">{subscription.status}</p>
                       </div>
                     </div>
                   )}
                 </div>
                 
                  <div className="flex gap-2 sm:gap-4 mt-6">
                    <Button 
                      onClick={handleSubscriptionManage} 
                      variant="outline" 
                      className="flex-1 h-7 sm:h-8 text-xs sm:text-sm px-4"
                    >
                      <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Manage in App</span>
                      <span className="sm:hidden">Manage</span>
                    </Button>
                    {!subscription.isActive && (
                      <Button 
                        onClick={handleUpgradePlan}
                        className="flex-1 h-7 sm:h-8 text-xs sm:text-sm px-4"
                      >
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Upgrade Plan</span>
                        <span className="sm:hidden">Upgrade</span>
                      </Button>
                    )}
                  </div>
               </Card>

               {/* Feature Access */}
               <Card className="p-6">
                 <h3 className="text-xl font-semibold text-foreground mb-4">Feature Access</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="flex items-center gap-3">
                     {hasUnlimitedLikes() ? (
                       <CheckCircle className="w-5 h-5 text-green-500" />
                     ) : (
                       <AlertCircle className="w-5 h-5 text-amber-500" />
                     )}
                     <div>
                       <p className="font-medium">Daily Likes</p>
                       <p className="text-sm text-muted-foreground">
                         {hasUnlimitedLikes() ? "Unlimited" : "10 per day"}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     {canListProperties(userProfile?.properties_listed || 0) ? (
                       <CheckCircle className="w-5 h-5 text-green-500" />
                     ) : (
                       <AlertCircle className="w-5 h-5 text-red-500" />
                     )}
                     <div>
                       <p className="font-medium">Property Listings</p>
                       <p className="text-sm text-muted-foreground">
                         {userProfile?.properties_listed || 0} / {getMaxProperties()} used
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     {hasAdvancedFilters() ? (
                       <CheckCircle className="w-5 h-5 text-green-500" />
                     ) : (
                       <AlertCircle className="w-5 h-5 text-gray-400" />
                     )}
                     <div>
                       <p className="font-medium">Advanced Filters</p>
                       <p className="text-sm text-muted-foreground">
                         {hasAdvancedFilters() ? "Enabled" : "Upgrade to unlock"}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     {hasAnalytics() ? (
                       <CheckCircle className="w-5 h-5 text-green-500" />
                     ) : (
                       <AlertCircle className="w-5 h-5 text-gray-400" />
                     )}
                     <div>
                       <p className="font-medium">Analytics Dashboard</p>
                       <p className="text-sm text-muted-foreground">
                         {hasAnalytics() ? "Enabled" : "Seller plans only"}
                       </p>
                     </div>
                   </div>
                 </div>
               </Card>

               {/* Usage Statistics */}
               <Card className="p-6">
                 <h3 className="text-xl font-semibold text-foreground mb-4">Current Usage</h3>
                 <div className="space-y-4">
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-medium">Daily Likes Used</span>
                       <span className="text-sm text-muted-foreground">
                         {userProfile?.daily_likes_used || 0} / {hasUnlimitedLikes() ? "∞" : 10}
                       </span>
                     </div>
                     <Progress 
                       value={hasUnlimitedLikes() ? 50 : ((userProfile?.daily_likes_used || 0) / 10) * 100} 
                       className="h-2"
                     />
                   </div>
                   
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-medium">Properties Listed</span>
                       <span className="text-sm text-muted-foreground">
                         {userProfile?.properties_listed || 0} / {getMaxProperties() === 999 ? "∞" : getMaxProperties()}
                       </span>
                     </div>
                     <Progress 
                       value={getMaxProperties() === 999 ? 30 : ((userProfile?.properties_listed || 0) / getMaxProperties()) * 100} 
                       className="h-2"
                     />
                   </div>
                 </div>
                 
                 {!subscription.isActive && (
                   <div className="mt-6 p-4 bg-accent/20 rounded-lg border">
                     <div className="flex items-start gap-3">
                       <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                       <div>
                         <h4 className="font-medium">Upgrade for More</h4>
                         <p className="text-sm text-muted-foreground mb-3">
                           Get unlimited daily likes, more property listings, and premium features.
                         </p>
                         <Button onClick={handleUpgradePlan} size="sm">
                           View Plans
                         </Button>
                       </div>
                     </div>
                   </div>
                 )}
               </Card>
             </div>
           </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-medium text-foreground">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive email updates about new matches</p>
                  </div>
                   <Button 
                     variant="outline" 
                     className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                     onClick={() => setEmailNotificationsDialogOpen(true)}
                   >
                     <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                     Configure
                   </Button>
                 </div>
                
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="font-medium text-foreground">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">Get notified about app activity</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                      onClick={() => setPushNotificationsDialogOpen(true)}
                    >
                      <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Configure
                    </Button>
                  </div>
                
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="font-medium text-foreground">Privacy Settings</h4>
                      <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                      onClick={() => setPrivacySettingsDialogOpen(true)}
                    >
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Manage
                    </Button>
                  </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Security</h3>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="font-medium text-foreground">Change Password</h4>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                      onClick={() => setChangingPassword(!changingPassword)}
                    >
                      {changingPassword ? 'Cancel' : 'Change'}
                    </Button>
                  </div>
                  
                  {changingPassword && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <Button 
                        onClick={handleChangePassword}
                        className="w-full"
                        disabled={!newPassword || !confirmPassword}
                      >
                        Update Password
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      Two-Factor Authentication
                      {userProfile?.two_factor_enabled && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {userProfile?.two_factor_enabled 
                        ? `Enabled via ${userProfile.two_factor_method || 'email'}`
                        : 'Add an extra layer of security'
                      }
                    </p>
                  </div>
                  {userProfile?.two_factor_enabled ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                        >
                          Disable
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the extra security layer from your account. You can re-enable it anytime.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDisable2FA}>
                            Disable 2FA
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                      onClick={() => setTwoFactorDialogOpen(true)}
                    >
                      Enable
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-medium text-foreground">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                    onClick={() => setActiveSessionsDialogOpen(true)}
                  >
                    View
                  </Button>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="font-medium text-destructive">Sign Out</h4>
                      <p className="text-sm text-muted-foreground">Sign out of your PropSwipes account</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Sign Out</span>
                      <span className="sm:hidden">Logout</span>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="font-medium text-destructive">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers, including:
                            <br /><br />
                            • Your profile information
                            <br />
                            • Property listings
                            <br />
                            • Messages and matches
                            <br />
                            • Subscription data
                            <br /><br />
                            Please confirm if you want to proceed with deleting your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        <TwoFactorSetupDialog
          open={twoFactorDialogOpen}
          onOpenChange={setTwoFactorDialogOpen}
          onSuccess={handleTwoFactorSuccess}
        />
        
        <ActiveSessionsDialog
          open={activeSessionsDialogOpen}
          onOpenChange={setActiveSessionsDialogOpen}
        />
        
        <EmailNotificationsDialog
          open={emailNotificationsDialogOpen}
          onOpenChange={setEmailNotificationsDialogOpen}
        />
        
        <PushNotificationsDialog
          open={pushNotificationsDialogOpen}
          onOpenChange={setPushNotificationsDialogOpen}
        />
        
        <PrivacySettingsDialog
          open={privacySettingsDialogOpen}
          onOpenChange={setPrivacySettingsDialogOpen}
        />
      </div>
    </div>
  );
};

export default Profile;