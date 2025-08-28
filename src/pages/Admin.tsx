import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Settings,
  Check,
  X,
  Eye,
  Flag,
  UserX,
  MessageSquare,
  Clock,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminAuth from "@/components/AdminAuth";

const Admin = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [deletedProperties, setDeletedProperties] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingProperties: 0,
    totalMatches: 0,
    deletedProperties: 0,
    pendingReports: 0,
    totalReports: 0,
    totalBlocks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already authenticated
    const isAdminAuth = localStorage.getItem("admin-authenticated") === "true";
    if (isAdminAuth) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      console.log('🔧 Admin Debug: Loading data...');
      
      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔧 Admin Debug: Users loaded:', usersData?.length);

      // Load active properties with detailed logging
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Load deleted properties
      const { data: deletedPropertiesData } = await supabase
        .from('properties')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      console.log('🔧 Admin Debug: Properties query result:', {
        data: propertiesData?.length,
        error: propertiesError
      });

      // Load stats with detailed logging
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      console.log('🔧 Admin Debug: Total properties count:', propertyCount);

      const { count: pendingCount, error: pendingError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .is('deleted_at', null);

      const { count: deletedCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null);

      console.log('🔧 Admin Debug: Pending count query result:', {
        count: pendingCount,
        error: pendingError
      });

      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });

      // Load moderation data - using simple selects since foreign keys don't exist
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: blockedUsersData } = await supabase
        .from('blocked_users')
        .select('*')
        .order('created_at', { ascending: false });

      const { count: pendingReportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: totalReportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      const { count: totalBlocksCount } = await supabase
        .from('blocked_users')
        .select('*', { count: 'exact', head: true });

      setUsers(usersData || []);
      setProperties(propertiesData || []);
      setDeletedProperties(deletedPropertiesData || []);
      setReports(reportsData || []);
      setBlockedUsers(blockedUsersData || []);
      setStats({
        totalUsers: userCount || 0,
        totalProperties: propertyCount || 0,
        pendingProperties: pendingCount || 0,
        totalMatches: matchCount || 0,
        deletedProperties: deletedCount || 0,
        pendingReports: pendingReportsCount || 0,
        totalReports: totalReportsCount || 0,
        totalBlocks: totalBlocksCount || 0
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    loadData();
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const handleApproveProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: 'approved' })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Property approved",
        description: "Property has been approved and is now visible to users",
        duration: 5000
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve property",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleRejectProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: 'rejected' })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Property rejected",
        description: "Property has been rejected",
        duration: 5000
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject property",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      // Soft delete to avoid FK violations (e.g., property_swipes references)
      const { error } = await supabase
        .from('properties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Property deleted",
        description: "The listing was archived and removed from active view.",
        duration: 5000
      });
      loadData();
    } catch (error) {
      console.error('Admin delete property failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-authenticated");
    setIsAuthenticated(false);
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'resolved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report resolved",
        description: "The report has been marked as resolved",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve report",
        variant: "destructive",
      });
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'dismissed',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report dismissed",
        description: "The report has been dismissed",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss report",
        variant: "destructive",
      });
    }
  };

  const handleUnblockUser = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: "User unblocked",
        description: "The user has been unblocked",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Create a temporary session token for the admin operation
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No admin session found');
      }

      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { targetUserId: userId } // Pass the target user ID for admin deletion
      });

      if (error) {
        console.error('Error calling delete function:', error);
        throw new Error(error.message || 'Failed to delete user account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User account deleted",
        description: "The user account has been successfully deactivated",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user account",
        variant: "destructive",
      });
    }
  };
  const handleViewProfile = (userId: string) => {
    // Navigate to the profile page with the user ID
    window.open(`/profile/${userId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, properties, and reports</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Access
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.totalProperties}</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.pendingProperties}</p>
                <p className="text-sm text-muted-foreground">Pending Properties</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Flag className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingReports}</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.totalMatches}</p>
                <p className="text-sm text-muted-foreground">Total Matches</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="moderation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="moderation">
              <Flag className="w-4 h-4 mr-2" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="properties">
              <Home className="w-4 h-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="deleted-properties">
              <Trash2 className="w-4 h-4 mr-2" />
              Deleted
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Moderation Tab */}
          <TabsContent value="moderation">
            <div className="space-y-6">
              {/* Reports Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">User Reports</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {stats.pendingReports} pending
                    </Badge>
                    <Badge variant="outline">
                      {stats.totalReports} total
                    </Badge>
                  </div>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reports submitted yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Reported User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                             <TableCell>
                               <div className="flex items-center gap-3">
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback>U</AvatarFallback>
                                 </Avatar>
                                 <span className="font-medium">
                                   {report.reporter_id || 'Unknown User'}
                                 </span>
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-3">
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback>U</AvatarFallback>
                                 </Avatar>
                                 <div>
                                   <div className="font-medium">
                                     {report.reported_user_id || 'Unknown User'}
                                   </div>
                                   <div className="text-sm text-muted-foreground">
                                     Reported User
                                   </div>
                                 </div>
                               </div>
                             </TableCell>
                            <TableCell>
                              <Badge variant="outline">{report.report_type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={report.description}>
                                {report.description || 'No description provided'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                report.status === 'pending' ? 'destructive' :
                                report.status === 'resolved' ? 'default' : 'secondary'
                              }>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(report.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewProfile(report.reported_user_id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {report.status === 'pending' && (
                                  <>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="default">
                                          <Check className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Resolve Report</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Mark this report as resolved? This action can be undone later.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleResolveReport(report.id)}>
                                            Resolve
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Dismiss Report</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Dismiss this report? This action can be undone later.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDismissReport(report.id)}>
                                            Dismiss
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>

              {/* Blocked Users Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Blocked Users</h3>
                  <Badge variant="outline">
                    {stats.totalBlocks} total blocks
                  </Badge>
                </div>

                {blockedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No blocked users</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Blocker</TableHead>
                          <TableHead>Blocked User</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedUsers.map((block) => (
                          <TableRow key={block.id}>
                             <TableCell>
                               <div className="flex items-center gap-3">
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback>U</AvatarFallback>
                                 </Avatar>
                                 <span className="font-medium">
                                   {block.blocker_id || 'Unknown User'}
                                 </span>
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-3">
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback>U</AvatarFallback>
                                 </Avatar>
                                 <div>
                                   <div className="font-medium">
                                     {block.blocked_id || 'Unknown User'}
                                   </div>
                                   <div className="text-sm text-muted-foreground">
                                     Blocked User
                                   </div>
                                 </div>
                               </div>
                             </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={block.reason}>
                                {block.reason || 'No reason provided'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(block.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewProfile(block.blocked_id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Ban className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Unblock User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Remove this block and allow these users to interact again?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleUnblockUser(block.id)}>
                                        Unblock
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Property Management</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {stats.pendingProperties} pending approval
                  </Badge>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {property.images && property.images.length > 0 && (
                            <img 
                              src={property.images[0]} 
                              alt={property.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{property.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.city}, {property.state}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{property.profiles?.display_name || 'Unknown'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">${property.price?.toLocaleString()}</p>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            property.status === 'approved' ? 'secondary' :
                            property.status === 'pending' ? 'default' : 'destructive'
                          }
                        >
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {new Date(property.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {property.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleApproveProperty(property.id)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectProperty(property.id)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/property/${property.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive Property</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will archive "{property.title}" and remove it from active listings. Related activity remains for audit.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProperty(property.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Archive
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Deleted Properties Tab */}
          <TabsContent value="deleted-properties">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Deleted Properties</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {stats.deletedProperties} deleted properties
                  </Badge>
                </div>
              </div>

              {deletedProperties.length === 0 ? (
                <div className="text-center py-12">
                  <Trash2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No deleted properties found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deleted Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {property.images && property.images.length > 0 && (
                              <img 
                                src={property.images[0]} 
                                alt={property.title}
                                className="w-16 h-12 object-cover rounded opacity-50"
                              />
                            )}
                            <div>
                              <p className="font-medium text-muted-foreground">{property.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {property.city}, {property.state}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{property.profiles?.display_name || 'Unknown'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-muted-foreground">${property.price?.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            Deleted
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {property.deleted_at ? new Date(property.deleted_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/property/${property.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-lg font-semibold">User Management</h3>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(user => 
                      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.bio?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.display_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{user.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.user_type || 'buyer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{user.location || 'Not specified'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => handleViewProfile(user.user_id)}
                           >
                             <Eye className="w-4 h-4 mr-1" />
                             View Profile
                           </Button>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button size="sm" variant="destructive">
                                 <UserX className="w-4 h-4 mr-1" />
                                 Delete
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   This will permanently deactivate {user.display_name || 'this user'}'s account and remove all their data including:
                                   <br /><br />
                                   • Profile information
                                   <br />
                                   • Property listings
                                   <br />
                                   • Messages and matches
                                   <br />
                                   • Swipes and activity
                                   <br /><br />
                                   This action cannot be undone.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => handleDeleteUser(user.user_id)}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   Yes, delete account
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Platform Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">User Growth</h4>
                  <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total registered users</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Property Listings</h4>
                  <p className="text-2xl font-bold text-green-600">{stats.totalProperties}</p>
                  <p className="text-sm text-muted-foreground">Properties listed</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Pending Approvals</h4>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingProperties}</p>
                  <p className="text-sm text-muted-foreground">Awaiting review</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Total Matches</h4>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalMatches}</p>
                  <p className="text-sm text-muted-foreground">Successful connections</p>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recent Activity</h4>
                <div className="space-y-2">
                  {properties.slice(0, 5).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{property.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Listed by {property.profiles?.display_name || 'Unknown'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(property.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
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