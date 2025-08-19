import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: `${userProfile.display_name}`,
          bio: userProfile.bio,
          location: userProfile.location,
          phone: userProfile.phone,
        })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        duration: 5000
      });
    } catch (error) {
      console.error('Error updating profile:', error);
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
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setUserProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
        duration: 5000
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex flex-wrap justify-center gap-1 p-1 h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-1 py-2 px-3 text-xs">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1 py-2 px-3 text-xs">
              <Home className="w-4 h-4" />
              <span>Properties</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-1 py-2 px-3 text-xs">
              <CreditCard className="w-4 h-4" />
              <span>Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 py-2 px-3 text-xs">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1 py-2 px-3 text-xs">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6 overflow-hidden">
              <div className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-start gap-4">
                   <div className="relative shrink-0">
                     <Avatar className="w-20 h-20">
                       <AvatarImage src={userProfile?.avatar_url} />
                       <AvatarFallback className="text-lg">
                         {userProfile?.display_name?.[0] || user?.email?.[0] || 'U'}
                       </AvatarFallback>
                     </Avatar>
                     {isEditing && (
                       <Button
                         size="sm"
                         className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 p-0"
                         onClick={triggerFileUpload}
                         disabled={uploadingAvatar}
                       >
                         <Camera className="w-3 h-3" />
                       </Button>
                     )}
                  </div>
                   <div className="flex-1 min-w-0">
                     <h2 className="text-xl font-bold text-foreground truncate">{userProfile?.display_name || user?.email}</h2>
                     <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                     <p className="text-xs text-muted-foreground capitalize truncate">{userProfile?.user_type || 'buyer'}</p>
                     <div className="flex items-center gap-2 mt-2">
                       <Badge variant={subscription.isActive ? "default" : "secondary"} className="flex items-center gap-1 text-xs">
                         {subscription.isActive ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                         <span className="truncate max-w-[80px]">{getTierDisplayName()}</span>
                       </Badge>
                       <Badge variant="outline" className="capitalize text-xs">
                         <span className="truncate">{userProfile?.user_type || 'buyer'}</span>
                       </Badge>
                     </div>
                   </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 gap-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2 min-w-0">
                       <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                       <Input
                         id="displayName"
                         value={userProfile?.display_name || ''}
                         onChange={(e) => setUserProfile({...userProfile, display_name: e.target.value})}
                         disabled={!isEditing}
                         className="w-full text-sm"
                         maxLength={50}
                       />
                     </div>
                     
                     <div className="space-y-2 min-w-0">
                       <Label htmlFor="email" className="text-sm">Email</Label>
                       <Input
                         id="email"
                         type="email"
                         value={user?.email || ''}
                         disabled={true}
                         className="bg-muted w-full text-sm truncate"
                         title={user?.email || ''}
                       />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2 min-w-0">
                       <Label htmlFor="phone" className="text-sm">Phone</Label>
                       <Input
                         id="phone"
                         value={userProfile?.phone || ''}
                         onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                         disabled={!isEditing}
                         placeholder="Phone number"
                         className="w-full text-sm"
                       />
                     </div>
                     
                     <div className="space-y-2 min-w-0">
                       <Label htmlFor="location" className="text-sm">Location</Label>
                       <Input
                         id="location"
                         value={userProfile?.location || ''}
                         onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                         disabled={!isEditing}
                         placeholder="Your location"
                         className="w-full text-sm"
                         maxLength={100}
                       />
                     </div>
                   </div>
                </div>

                 <div className="space-y-2">
                   <Label htmlFor="bio">Bio</Label>
                   <textarea
                     id="bio"
                     className="w-full p-3 border border-border rounded-md bg-background text-foreground disabled:opacity-50 resize-none text-sm"
                     rows={2}
                     value={userProfile?.bio || ''}
                     onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                     disabled={!isEditing}
                     placeholder="Tell others about yourself..."
                     maxLength={150}
                   />
                   <p className="text-xs text-muted-foreground">
                     {userProfile?.bio?.length || 0}/150 characters
                   </p>
                 </div>
                {isEditing && (
                  <div className="flex gap-4">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card>
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
                 
                 <div className="flex gap-4 mt-6">
                   <Button onClick={handleSubscriptionManage} variant="outline">
                     <Smartphone className="w-4 h-4 mr-2" />
                     Manage in App
                   </Button>
                   {!subscription.isActive && (
                     <Button onClick={handleUpgradePlan}>
                       <Crown className="w-4 h-4 mr-2" />
                       Upgrade Plan
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
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive email updates about new matches</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Bell className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get notified about app activity</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Privacy Settings</h4>
                    <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                  </div>
                  <Button variant="outline" size="sm">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">Change Password</h4>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
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
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-destructive">Sign Out</h4>
                      <p className="text-sm text-muted-foreground">Sign out of your PropSwipes account</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-destructive">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Account
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
      </div>
    </div>
  );
};

export default Profile;