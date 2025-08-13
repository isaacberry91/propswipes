import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Home
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
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      setUserProfile(data);
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="properties">
              <Home className="w-4 h-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6">
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                   <div className="relative">
                     <Avatar className="w-24 h-24">
                       <AvatarImage src={userProfile?.avatar_url} />
                       <AvatarFallback className="text-xl">
                         {userProfile?.display_name?.[0] || user?.email?.[0] || 'U'}
                       </AvatarFallback>
                     </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => {
                          // TODO: Implement image upload
                          toast({
                            title: "Upload photo",
                            description: "Photo upload feature coming soon!",
                            duration: 5000
                          });
                        }}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                   <div>
                     <h2 className="text-2xl font-bold text-foreground">{userProfile?.display_name || user?.email}</h2>
                     <p className="text-muted-foreground">{user?.email}</p>
                     <p className="text-sm text-muted-foreground">{userProfile?.user_type || 'buyer'}</p>
                     <div className="flex items-center gap-2 mt-2">
                       <Badge variant={subscription.isActive ? "default" : "secondary"} className="flex items-center gap-1">
                         {subscription.isActive ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                         {getTierDisplayName()}
                       </Badge>
                       <Badge variant="outline" className="capitalize">
                         {userProfile?.user_type || 'buyer'}
                       </Badge>
                     </div>
                   </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label htmlFor="displayName">Display Name</Label>
                     <Input
                       id="displayName"
                       value={userProfile?.display_name || ''}
                       onChange={(e) => setUserProfile({...userProfile, display_name: e.target.value})}
                       disabled={!isEditing}
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                       id="email"
                       type="email"
                       value={user?.email || ''}
                       disabled={true}
                       className="bg-muted"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="phone">Phone</Label>
                     <Input
                       id="phone"
                       value={userProfile?.phone || ''}
                       onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                       disabled={!isEditing}
                       placeholder="Enter your phone number"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="location">Location</Label>
                     <Input
                       id="location"
                       value={userProfile?.location || ''}
                       onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                       disabled={!isEditing}
                       placeholder="Enter your location"
                     />
                   </div>
                </div>

                 <div className="space-y-2">
                   <Label htmlFor="bio">Bio</Label>
                   <textarea
                     id="bio"
                     className="w-full p-3 border border-border rounded-md bg-background text-foreground disabled:opacity-50"
                     rows={3}
                     value={userProfile?.bio || ''}
                     onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                     disabled={!isEditing}
                     placeholder="Tell others about yourself and your real estate interests..."
                   />
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
            <Card className="p-6">
              <PropertyManager onPropertyUpdate={fetchUserProfile} />
            </Card>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Change Password</h4>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
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
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;