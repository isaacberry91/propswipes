import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, Users, Clock, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { resolveUserProfile } from "@/utils/profileUtils";

interface Match {
  id: string;
  property: {
    id: string;
    title: string;
    location: string;
    price: string;
    image: string;
  };
  matchedUser: {
    name: string;
    avatar: string;
    type: string;
  };
  lastMessage: string;
  matchedAt: string;
  unreadCount: number;
}

const Matches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const [hasProperties, setHasProperties] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user's profile first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        setLoading(false);
        return;
      }

      setUserType(userProfile.user_type);

      // Check if user has any properties (making them a seller)
      const { data: userProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', userProfile.id)
        .is('deleted_at', null) // Exclude soft-deleted properties
        .limit(1);

      setHasProperties(userProperties && userProperties.length > 0);

      // Fetch matches where user is either buyer or seller
      console.log('🔥 MATCHES DEBUG - User profile ID:', userProfile.id);
      
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          property_id,
          buyer_id,
          seller_id,
          properties!left (
            id,
            title,
            city,
            state,
            price,
            images,
            deleted_at
          ),
          buyer_profile:profiles!buyer_id (
            id,
            display_name,
            avatar_url,
            user_type
          ),
          seller_profile:profiles!seller_id (
            id,
            display_name,
            avatar_url,
            user_type
          )
        `)
        .or(`buyer_id.eq.${userProfile.id},seller_id.eq.${userProfile.id}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      console.log('🔥 MATCHES DEBUG - Raw matches data:', matchesData);
      console.log('🔥 MATCHES DEBUG - Matches error:', error);
      console.log('🔥 MATCHES DEBUG - Number of matches found:', matchesData?.length || 0);

      if (error) {
        console.error('Error fetching matches:', error);
        toast({
          title: "Error loading matches",
          description: "There was an issue loading your matches.",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface
      const transformedMatches = await Promise.all(matchesData?.map(async (match: any) => {
        const isUserBuyer = match.buyer_id === userProfile.id;
        const otherUserProfileId = isUserBuyer ? match.seller_id : match.buyer_id;
        const joinedProfile = isUserBuyer ? match.seller_profile : match.buyer_profile;
        const property = match.properties;

        console.log('🔥 MATCHES DEBUG - Match ID:', match.id);
        console.log('🔥 MATCHES DEBUG - Other user profile ID:', otherUserProfileId);
        console.log('🔥 MATCHES DEBUG - Joined profile:', joinedProfile);

        // Use shared utility to resolve user profile
        const resolvedUser = await resolveUserProfile(otherUserProfileId, joinedProfile);

        return {
          id: match.id,
          property: {
            id: property?.id || match.property_id,
            title: property?.title || 'Removed Property',
            location: property ? `${property.city}, ${property.state}` : '—',
            price: property?.price != null ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            }).format(property.price) : '—',
            image: property?.images?.[0] || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png"
          },
          matchedUser: {
            name: resolvedUser.name,
            avatar: resolvedUser.avatar,
            type: resolvedUser.type
          },
          lastMessage: "Start the conversation!",
          matchedAt: new Date(match.created_at).toLocaleDateString(),
          unreadCount: 0
        };
      }) || []);

      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load matches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Heart className="w-12 h-12 text-love mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Property Connections</h1>
          <p className="text-muted-foreground">Connect with interested parties for property opportunities</p>
          
          {(userType === 'seller' || hasProperties || matches.length > 0) && (
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => navigate('/chat-management')}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Manage All Conversations
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <Card className="p-8 text-center shadow-card border-0">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No connections yet</h3>
            <p className="text-muted-foreground mb-4">
              Start browsing to find people interested in property opportunities!
            </p>
            <Button variant="gradient" onClick={() => navigate('/discover')}>
              Browse Properties
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <Card key={match.id} className="group relative overflow-hidden bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-6">
                  <div className="flex gap-4">
                    {/* Property Image with elegant frame */}
                    <div className="relative flex-shrink-0">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 p-1">
                        <img 
                          src={match.property.image} 
                          alt={match.property.title}
                          className="w-24 h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
                      </div>
                      {/* Floating heart icon */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-love to-love/80 rounded-full flex items-center justify-center shadow-md">
                        <Heart className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                    
                    {/* Match Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                            {match.property.title}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4 mr-1 text-primary/70" />
                            <span>{match.property.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">
                            {match.property.price}
                          </span>
                        </div>
                      </div>
                      
                      {/* Matched User Info with elegant styling */}
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30">
                        <div className="relative">
                          <img 
                            src={match.matchedUser.avatar} 
                            alt={match.matchedUser.name}
                            className="w-8 h-8 object-cover rounded-full ring-2 ring-primary/30"
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-foreground">
                            {match.matchedUser.name}
                          </span>
                          <span className="ml-2 text-xs bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                            {match.matchedUser.type}
                          </span>
                        </div>
                      </div>
                      
                      {/* Last Message with elegant styling */}
                      <div className="mb-4 p-3 rounded-lg bg-muted/30 border-l-4 border-primary/40">
                        <p className="text-sm text-muted-foreground italic">
                          "{match.lastMessage}"
                        </p>
                      </div>
                      
                      {/* Match Time & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground bg-accent/20 px-3 py-1 rounded-full">
                          <Clock className="w-3 h-3 mr-1 text-primary/70" />
                          <span>{match.matchedAt}</span>
                        </div>
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleChatClick(match.id)}
                          className="relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 rounded-full px-6"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                          {match.unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-love text-love-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                              {match.unreadCount}
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;