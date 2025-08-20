import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MessageCircle, 
  Search, 
  User, 
  Building, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter,
  MessageSquare,
  Users,
  Target,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  matchId: string;
  buyerName: string;
  buyerAvatar: string;
  buyerId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyPrice: number;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageDate: Date;
  unreadCount: number;
  totalMessages: number;
  responseTime: number; // Average response time in hours
  status: 'hot' | 'warm' | 'cold' | 'archived';
  matchedDaysAgo: number;
}

interface Analytics {
  totalConversations: number;
  activeConversations: number;
  averageResponseTime: number;
  totalLeads: number;
  conversionRate: number;
  totalPropertyValue: number;
  hotLeads: number;
  responseRateToday: number;
}

const ChatManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get user's profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        navigate('/matches');
        return;
      }

      // Check if user has properties (making them eligible for chat management)
      const { data: userProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', userProfile.id)
        .is('deleted_at', null)
        .limit(1);

      const hasProperties = userProperties && userProperties.length > 0;

      // Allow access if user is a seller OR has properties
      if (userProfile.user_type !== 'seller' && !hasProperties) {
        navigate('/matches');
        return;
      }

      // Fetch all matches for this seller
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          buyer_id,
          seller_id,
          property_id,
          created_at,
          properties!inner (
            title,
            images,
            price
          ),
          buyer_profile:profiles!buyer_id (
            display_name,
            avatar_url
          )
        `)
        .eq('seller_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // Enhanced conversation data with analytics
      const conversationsData = await Promise.all(
        matches?.map(async (match) => {
          // Get all messages for this match
          const { data: allMessages } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: true });

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .neq('sender_id', userProfile.id);

          // Calculate analytics
          const totalMessages = allMessages?.length || 0;
          const matchedDaysAgo = Math.floor((Date.now() - new Date(match.created_at).getTime()) / (1000 * 60 * 60 * 24));
          const lastMessageDate = lastMessage ? new Date(lastMessage.created_at) : new Date(match.created_at);
          const daysSinceLastMessage = Math.floor((Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calculate average response time (simplified)
          let responseTime = 24; // Default 24 hours
          if (allMessages && allMessages.length > 1) {
            const responses = allMessages.filter(msg => msg.sender_id === userProfile.id);
            responseTime = responses.length > 0 ? Math.max(1, 48 - (responses.length * 4)) : 48;
          }

          // Determine conversation status
          let status: 'hot' | 'warm' | 'cold' | 'archived' = 'cold';
          if (daysSinceLastMessage === 0 && unreadCount && unreadCount > 0) status = 'hot';
          else if (daysSinceLastMessage <= 2 && totalMessages > 3) status = 'warm';
          else if (daysSinceLastMessage <= 7) status = 'warm';
          else if (daysSinceLastMessage > 14) status = 'archived';

          return {
            matchId: match.id,
            buyerName: match.buyer_profile?.display_name || 'Unknown Buyer',
            buyerAvatar: match.buyer_profile?.avatar_url || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
            buyerId: match.buyer_id,
            propertyTitle: match.properties?.title || 'Unknown Property',
            propertyImage: match.properties?.images?.[0] || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
            propertyPrice: match.properties?.price || 0,
            lastMessage: lastMessage?.content || 'No messages yet',
            lastMessageTime: lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : '',
            lastMessageDate,
            unreadCount: unreadCount || 0,
            totalMessages,
            responseTime,
            status,
            matchedDaysAgo
          };
        }) || []
      );

      setConversations(conversationsData);
      
      // Calculate analytics
      const totalConversations = conversationsData.length;
      const activeConversations = conversationsData.filter(c => c.status !== 'archived').length;
      const averageResponseTime = conversationsData.reduce((acc, c) => acc + c.responseTime, 0) / totalConversations || 0;
      const totalLeads = totalConversations;
      const hotLeads = conversationsData.filter(c => c.status === 'hot').length;
      const totalPropertyValue = conversationsData.reduce((acc, c) => acc + c.propertyPrice, 0);
      const responsiveConversations = conversationsData.filter(c => c.totalMessages > 2).length;
      const conversionRate = responsiveConversations / totalConversations * 100 || 0;
      const responseRateToday = conversationsData.filter(c => 
        c.lastMessageDate.toDateString() === new Date().toDateString()
      ).length;

      setAnalytics({
        totalConversations,
        activeConversations,
        averageResponseTime,
        totalLeads,
        conversionRate,
        totalPropertyValue,
        hotLeads,
        responseRateToday
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedConversations.size === 0) {
      toast({
        title: "No conversations selected",
        description: "Please select conversations to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    // Implement bulk actions like mark as read, archive, etc.
    toast({
      title: "Bulk Action",
      description: `${action} applied to ${selectedConversations.size} conversations.`,
    });
    setSelectedConversations(new Set());
  };

  const toggleConversationSelection = (matchId: string) => {
    const newSelection = new Set(selectedConversations);
    if (newSelection.has(matchId)) {
      newSelection.delete(matchId);
    } else {
      newSelection.add(matchId);
    }
    setSelectedConversations(newSelection);
  };

  // Filter and sort conversations
  const filteredAndSortedConversations = conversations
    .filter(conv => {
      const matchesSearch = conv.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conv.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
        case "unread":
          return b.unreadCount - a.unreadCount;
        case "value":
          return b.propertyPrice - a.propertyPrice;
        case "response":
          return a.responseTime - b.responseTime;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conversation Dashboard</h1>
            <p className="text-muted-foreground">Manage leads, track performance, and analyze conversations</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Conversations</p>
                      <p className="text-2xl font-bold">{analytics.totalConversations}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <Target className="w-8 h-8 text-love" />
                    <div>
                      <p className="text-sm text-muted-foreground">Hot Leads</p>
                      <p className="text-2xl font-bold text-love">{analytics.hotLeads}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-warning" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Property Value</p>
                      <p className="text-2xl font-bold">
                        ${(analytics.totalPropertyValue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" onClick={() => setActiveTab("conversations")}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  View All Chats
                </Button>
                <Button variant="outline" onClick={() => handleBulkAction("mark_read")}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
                <Button variant="outline" onClick={() => setStatusFilter("hot")}>
                  <Target className="w-4 h-4 mr-2" />
                  Hot Leads Only
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("analytics")}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {filteredAndSortedConversations.slice(0, 5).map((conv) => (
                  <div key={conv.matchId} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conv.buyerAvatar} />
                      <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{conv.buyerName}</p>
                      <p className="text-sm text-muted-foreground">{conv.propertyTitle}</p>
                    </div>
                    <Badge variant={
                      conv.status === 'hot' ? 'default' : 
                      conv.status === 'warm' ? 'secondary' : 'outline'
                    }>
                      {conv.status}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/chat/${conv.matchId}`)}
                    >
                      Chat
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="conversations" className="space-y-6">
            {/* Filters and Search */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="unread">Unread First</SelectItem>
                    <SelectItem value="value">Property Value</SelectItem>
                    <SelectItem value="response">Response Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedConversations.size > 0 && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => handleBulkAction("mark_read")}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Read ({selectedConversations.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("archive")}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Archive ({selectedConversations.size})
                  </Button>
                </div>
              )}
            </Card>

            {/* Conversations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedConversations.map((conv) => (
                <Card key={conv.matchId} className="p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedConversations.has(conv.matchId)}
                      onChange={() => toggleConversationSelection(conv.matchId)}
                      className="mt-1"
                    />
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.buyerAvatar} />
                      <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground truncate">{conv.buyerName}</h3>
                        <Badge variant={
                          conv.status === 'hot' ? 'default' : 
                          conv.status === 'warm' ? 'secondary' : 'outline'
                        }>
                          {conv.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate mb-1">{conv.propertyTitle}</p>
                      <p className="text-sm font-medium text-primary mb-2">
                        ${conv.propertyPrice.toLocaleString()}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {conv.totalMessages} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {conv.responseTime}h avg
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground truncate mb-3">
                        {conv.lastMessage}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {conv.lastMessageTime}
                        </span>
                        <div className="flex gap-2">
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conv.unreadCount} new
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/chat/${conv.matchId}`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Conversations</span>
                        <span className="font-medium">{analytics.activeConversations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Response Time</span>
                        <span className="font-medium">{analytics.averageResponseTime.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Today's Responses</span>
                        <span className="font-medium">{analytics.responseRateToday}</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Lead Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hot Leads</span>
                        <span className="font-medium text-love">{analytics.hotLeads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Warm Leads</span>
                        <span className="font-medium">
                          {conversations.filter(c => c.status === 'warm').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cold Leads</span>
                        <span className="font-medium">
                          {conversations.filter(c => c.status === 'cold').length}
                        </span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Property Value</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="font-medium">
                          ${(analytics.totalPropertyValue / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Property</span>
                        <span className="font-medium">
                          ${(analytics.totalPropertyValue / analytics.totalConversations / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <span className="font-medium">{analytics.conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatManagement;