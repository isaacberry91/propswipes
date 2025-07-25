import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Home, 
  Shield, 
  AlertTriangle,
  Ban,
  Trash2,
  Search,
  Filter,
  BarChart3,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with real data
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      status: "active",
      type: "buyer",
      joinDate: "2024-01-15",
      reportCount: 0
    },
    {
      id: 2,
      name: "Sarah Chen",
      email: "sarah@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b429?w=100&h=100&fit=crop&crop=face",
      status: "active",
      type: "seller",
      joinDate: "2024-02-10",
      reportCount: 2
    }
  ];

  const properties = [
    {
      id: 1,
      title: "Modern Downtown Condo",
      owner: "John Doe",
      price: "$850,000",
      status: "active",
      reports: 0,
      views: 245
    },
    {
      id: 2,
      title: "Luxury Penthouse",
      owner: "Sarah Chen", 
      price: "$1,200,000",
      status: "pending",
      reports: 1,
      views: 189
    }
  ];

  const reports = [
    {
      id: 1,
      reporter: "Alice Smith",
      reported: "Bob Wilson",
      reason: "Inappropriate behavior",
      date: "2024-07-20",
      status: "pending"
    },
    {
      id: 2,
      reporter: "Mike Johnson",
      reported: "Sarah Chen",
      reason: "Fake listing",
      date: "2024-07-18",
      status: "resolved"
    }
  ];

  const handleBlockUser = (userId: number) => {
    toast({
      title: "User blocked",
      description: "User has been blocked successfully",
    });
  };

  const handleDeleteUser = (userId: number) => {
    toast({
      title: "Account deleted",
      description: "User account and all data have been permanently deleted",
    });
  };

  const handleDeleteProperty = (propertyId: number) => {
    toast({
      title: "Property deleted",
      description: "Property listing has been removed",
    });
  };

  const handleResolveReport = (reportId: number) => {
    toast({
      title: "Report resolved",
      description: "Report has been marked as resolved",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, properties, and reports</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Access
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">1,247</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Home className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">892</p>
                <p className="text-sm text-muted-foreground">Properties</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">23</p>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$2.4M</p>
                <p className="text-sm text-muted-foreground">Total Volume</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="properties">
              <Home className="w-4 h-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="reports">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{user.type}</Badge>
                          <Badge 
                            variant={user.status === 'active' ? 'secondary' : 'destructive'} 
                            className="text-xs"
                          >
                            {user.status}
                          </Badge>
                          {user.reportCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {user.reportCount} reports
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleBlockUser(user.id)}>
                        <Ban className="w-4 h-4 mr-2" />
                        Block
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {user.name}'s account and all associated data including listings, messages, and profile information. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Property Listings</h3>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-semibold text-foreground">{property.title}</h4>
                      <p className="text-sm text-muted-foreground">Owner: {property.owner}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-primary">{property.price}</span>
                        <Badge variant="outline" className="text-xs">{property.status}</Badge>
                        <span className="text-xs text-muted-foreground">{property.views} views</span>
                        {property.reports > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {property.reports} reports
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Reports</h3>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-semibold text-foreground">Report #{report.id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.reporter} reported {report.reported}
                      </p>
                      <p className="text-sm text-foreground mt-1">Reason: {report.reason}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={report.status === 'pending' ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {report.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{report.date}</span>
                      </div>
                    </div>
                    
                    {report.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolveReport(report.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Admin Settings</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Platform Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">Backup Database</Button>
                    <Button variant="outline">Export User Data</Button>
                    <Button variant="outline">System Maintenance</Button>
                    <Button variant="outline">Update Terms</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Security Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">View Login Logs</Button>
                    <Button variant="outline">Configure 2FA</Button>
                    <Button variant="outline">IP Whitelist</Button>
                    <Button variant="outline">API Settings</Button>
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

export default Admin;