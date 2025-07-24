import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield, 
  Star,
  Crown,
  Edit2,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock user data - replace with real data from your auth system
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    bio: "Real estate enthusiast looking for investment opportunities",
    avatar: ""
  });

  // Mock subscription data - replace with real data
  const [subscriptionData] = useState({
    plan: "Buyer Pro",
    status: "active",
    nextBilling: "2025-02-24",
    price: 9.99
  });

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleSubscriptionManage = () => {
    // TODO: Open subscription management
    toast({
      title: "Opening subscription management",
      description: "Redirecting to subscription portal...",
    });
  };

  const handleUpgradePlan = () => {
    // TODO: Navigate to subscription page
    window.location.href = "/subscription";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
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
                      <AvatarImage src={userData.avatar} />
                      <AvatarFallback className="text-xl">
                        {userData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{userData.name}</h2>
                    <p className="text-muted-foreground">{userData.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {subscriptionData.plan}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => setUserData({...userData, name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={userData.phone}
                      onChange={(e) => setUserData({...userData, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={userData.location}
                      onChange={(e) => setUserData({...userData, location: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full p-3 border border-border rounded-md bg-background text-foreground disabled:opacity-50"
                    rows={3}
                    value={userData.bio}
                    onChange={(e) => setUserData({...userData, bio: e.target.value})}
                    disabled={!isEditing}
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

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Current Plan</h3>
                  <Badge 
                    variant="secondary" 
                    className="bg-emerald-100 text-emerald-800 border-emerald-200"
                  >
                    Active
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{subscriptionData.plan}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${subscriptionData.price}/month
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Next billing date</p>
                      <p className="font-medium text-foreground">{subscriptionData.nextBilling}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium text-foreground capitalize">{subscriptionData.status}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button onClick={handleSubscriptionManage} variant="outline">
                    Manage Subscription
                  </Button>
                  <Button onClick={handleUpgradePlan}>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </div>
              </Card>

              {/* Usage Statistics */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Usage This Month</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">∞</p>
                    <p className="text-sm text-muted-foreground">Daily Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">23</p>
                    <p className="text-sm text-muted-foreground">Saved Properties</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-sm text-muted-foreground">Matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">142</p>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                  </div>
                </div>
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
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;