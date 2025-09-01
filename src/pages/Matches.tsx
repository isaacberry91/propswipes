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
          lastMessage: "",
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

  const handleCardClick = (matchId: string) => {
    navigate(`/match/${matchId}`);
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
              <Card 
                key={match.id} 
                className="group relative overflow-hidden bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                onClick={() => handleCardClick(match.id)}
              >
                <div className="relative p-4">
                  <div className="flex gap-3">
                    {/* Property Image - smaller */}
                    <div className="relative flex-shrink-0">
                      <div className="relative overflow-hidden rounded-lg">
                        <img 
                          src={match.property.image} 
                          alt={match.property.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                      {/* Small heart icon */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-love rounded-full flex items-center justify-center">
                        <Heart className="w-2 h-2 text-white fill-white" />
                      </div>
                    </div>
                    
                    {/* Match Content - compact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                            {match.property.title}
                          </h3>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{match.property.location}</span>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <span className="text-sm font-bold text-primary">
                            {match.property.price}
                          </span>
                        </div>
                      </div>
                      
                      {/* User name and type */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">
                            {match.matchedUser.name}
                          </span>
                          <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                            {match.matchedUser.type}
                          </span>
                        </div>
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatClick(match.id);
                          }}
                          className="text-xs px-3 py-1 h-7"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Chat
                          {match.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-love text-love-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
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