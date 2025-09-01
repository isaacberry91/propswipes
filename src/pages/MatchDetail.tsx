import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, ArrowLeft, Bed, Bath, Square } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { resolveUserProfile } from "@/utils/profileUtils";

interface MatchDetail {
  id: string;
  property: {
    id: string;
    title: string;
    location: string;
    price: string;
    images: string[];
    description: string;
    bedrooms: number;
    bathrooms: number;
    square_feet: number;
    property_type: string;
    amenities: string[];
  };
  matchedUser: {
    name: string;
    avatar: string;
    type: string;
    bio: string;
  };
  matchedAt: string;
}

const MatchDetail = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && matchId) {
      fetchMatchDetail();
    }
  }, [user, matchId]);

  const fetchMatchDetail = async () => {
    if (!user || !matchId) return;
    
    setLoading(true);
    try {
      // Get user's profile first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        setLoading(false);
        return;
      }

      // Fetch match with property and user details
      const { data: matchData, error } = await supabase
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
            description,
            bedrooms,
            bathrooms,
            square_feet,
            property_type,
            amenities
          ),
          buyer_profile:profiles!buyer_id (
            id,
            display_name,
            avatar_url,
            user_type,
            bio
          ),
          seller_profile:profiles!seller_id (
            id,
            display_name,
            avatar_url,
            user_type,
            bio
          )
        `)
        .eq('id', matchId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching match detail:', error);
        toast({
          title: "Error loading match",
          description: "There was an issue loading the match details.",
          variant: "destructive",
        });
        navigate('/matches');
        return;
      }

      const isUserBuyer = matchData.buyer_id === userProfile.id;
      const otherUserProfileId = isUserBuyer ? matchData.seller_id : matchData.buyer_id;
      const joinedProfile = isUserBuyer ? matchData.seller_profile : matchData.buyer_profile;
      const property = matchData.properties;

      // Use shared utility to resolve user profile
      const resolvedUser = await resolveUserProfile(otherUserProfileId, joinedProfile);

      const transformedMatch: MatchDetail = {
        id: matchData.id,
        property: {
          id: property?.id || matchData.property_id,
          title: property?.title || 'Removed Property',
          location: property ? `${property.city}, ${property.state}` : '—',
          price: property?.price != null ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(property.price) : '—',
          images: property?.images || ["/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png"],
          description: property?.description || '',
          bedrooms: property?.bedrooms || 0,
          bathrooms: property?.bathrooms || 0,
          square_feet: property?.square_feet || 0,
          property_type: property?.property_type || '',
          amenities: property?.amenities || []
        },
        matchedUser: {
          name: resolvedUser.name,
          avatar: resolvedUser.avatar,
          type: resolvedUser.type,
          bio: joinedProfile?.bio || ''
        },
        matchedAt: new Date(matchData.created_at).toLocaleDateString()
      };

      setMatch(transformedMatch);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load match details.",
        variant: "destructive",
      });
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = () => {
    navigate(`/chat/${matchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center space-y-4 pt-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading match details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center pt-20">
            <p className="text-muted-foreground">Match not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/matches')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-love fill-love" />
            <span className="text-sm font-medium">Match</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Property Images */}
        <Card className="overflow-hidden">
          <div className="aspect-video relative">
            <img 
              src={match.property.images[0]} 
              alt={match.property.title}
              className="w-full h-full object-cover"
            />
          </div>
        </Card>

        {/* Property Details */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{match.property.title}</h1>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{match.property.location}</span>
            </div>
            <div className="text-3xl font-bold text-primary">{match.property.price}</div>
          </div>

          {/* Property Stats */}
          <div className="flex gap-4 py-2">
            {match.property.bedrooms > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bed className="w-4 h-4" />
                <span>{match.property.bedrooms} bed</span>
              </div>
            )}
            {match.property.bathrooms > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bath className="w-4 h-4" />
                <span>{match.property.bathrooms} bath</span>
              </div>
            )}
            {match.property.square_feet > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Square className="w-4 h-4" />
                <span>{match.property.square_feet.toLocaleString()} sqft</span>
              </div>
            )}
          </div>

          {/* Property Type */}
          {match.property.property_type && (
            <div className="text-sm">
              <span className="bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                {match.property.property_type}
              </span>
            </div>
          )}

          {/* Description */}
          {match.property.description && (
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {match.property.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {match.property.amenities.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {match.property.amenities.map((amenity, index) => (
                  <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Matched User */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Matched with</h3>
          <div className="flex items-center gap-3">
            <img 
              src={match.matchedUser.avatar} 
              alt={match.matchedUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-medium">{match.matchedUser.name}</div>
              <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                {match.matchedUser.type}
              </span>
            </div>
          </div>
          {match.matchedUser.bio && (
            <p className="text-sm text-muted-foreground">{match.matchedUser.bio}</p>
          )}
          <div className="text-xs text-muted-foreground">
            Matched on {match.matchedAt}
          </div>
        </Card>

        {/* Chat Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleChatClick}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Start Conversation
        </Button>
      </div>
    </div>
  );
};

export default MatchDetail;