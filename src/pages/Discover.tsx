import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Bed, Bath, Square, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SearchFilters from "@/components/SearchFilters";
import LocationSearch from "@/components/LocationSearch";
import SubscriptionPrompt from "@/components/SubscriptionPrompt";
import { useSubscription } from "@/hooks/useSubscription";

interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  city: string;
  state: string;
  images: string[];
  amenities: string[];
  description: string;
  property_type: string;
}

const Discover = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("Seattle, WA");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0);
  const [showLikePrompt, setShowLikePrompt] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, hasUnlimitedLikes } = useSubscription();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchProperties();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setUserProfile(data);
    
    // Check daily likes usage
    if (data) {
      const today = new Date().toDateString();
      const resetDate = data.daily_likes_reset_date ? new Date(data.daily_likes_reset_date).toDateString() : null;
      
      if (resetDate !== today) {
        // Reset daily likes if it's a new day
        await supabase
          .from('profiles')
          .update({ 
            daily_likes_used: 0, 
            daily_likes_reset_date: new Date().toISOString().split('T')[0]
          })
          .eq('user_id', user.id);
        setDailyLikesUsed(0);
      } else {
        setDailyLikesUsed(data.daily_likes_used || 0);
      }
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .limit(20);

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error loading properties",
          description: "We'll show you some sample properties instead.",
          variant: "destructive",
          duration: 5000
        });
        // Fallback to sample data
        setProperties([]);
      } else {
        setProperties(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    console.log('🚀 HandleSwipe called with direction:', direction);
    console.log('🚀 User exists:', !!user);
    console.log('🚀 UserProfile exists:', !!userProfile);
    console.log('🚀 IsAnimating:', isAnimating);
    
    if (isAnimating || !user || !userProfile) {
      console.log('🚀 Early return due to conditions');
      return;
    }
    
    // Check like limits for non-subscribers
    if (direction === 'right' && !hasUnlimitedLikes() && dailyLikesUsed >= 10) {
      console.log('🚀 Like limit reached, showing prompt');
      setShowLikePrompt(true);
      return;
    }
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    const property = properties[currentIndex];
    console.log('🚀 Current property:', property?.id, property?.title);
    
    try {
      console.log('🚀 About to insert swipe to database');
      // Record the swipe
      const { data, error } = await supabase
        .from('property_swipes')
        .insert({
          user_id: userProfile.id,
          property_id: property.id,
          is_liked: direction === 'right'
        });
      
      console.log('🚀 Swipe insert result:', { data, error });

      if (direction === 'right') {
        // Update daily likes counter for non-subscribers
        if (!hasUnlimitedLikes()) {
          const newLikesUsed = dailyLikesUsed + 1;
          setDailyLikesUsed(newLikesUsed);
          
          await supabase
            .from('profiles')
            .update({ daily_likes_used: newLikesUsed })
            .eq('user_id', user.id);
        }
        
        toast({
          title: "Property Liked! 💕",
          description: `You liked ${property.title}. Looking for matches...`,
          duration: 5000
        });
        
        // Check for potential matches
        // This would be expanded to check if the property owner also liked the user
      } else {
        toast({
          title: "Property Passed",
          description: "Looking for your next match...",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
      setSwipeDirection(null);
    }, 300);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatSquareFeet = (sqft: number) => {
    return new Intl.NumberFormat('en-US').format(sqft);
  };

  const getPropertiesForLocation = async (location: string, radius: number = 10) => {
    setSelectedLocation(location);
    setLoading(true);
    
    try {
      // Search by address first, then fallback to city  
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .or(`address.ilike.%${location}%,city.ilike.%${location.split(',')[0].trim()}%`)
        .limit(20);

      if (error) throw error;
      
      setProperties(data || []);
      setCurrentIndex(0);
      
      toast({
        title: "Location Updated! 📍", 
        description: `Found ${data?.length || 0} properties within ${radius} miles of ${location}`,
        duration: 5000
      });
    } catch (error) {
      console.error('Error fetching properties by location:', error);
      toast({
        title: "Error",
        description: "Could not load properties for that location.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header - Always Visible */}
      <div className="flex-shrink-0 bg-background border-b border-border">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
                alt="PropSwipes" 
                className="w-6 h-6"
              />
              <span className="text-base font-bold text-primary">PropSwipes</span>
              {subscription.isActive && (
                <Crown className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {!hasUnlimitedLikes() && (
                <div className="bg-accent px-2 py-1 rounded-full text-xs">
                  {10 - dailyLikesUsed} likes left
                </div>
              )}
              <SearchFilters />
            </div>
          </div>
          
          <LocationSearch
            value={selectedLocation}
            onChange={getPropertiesForLocation}
            placeholder="Search properties anywhere..."
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 overflow-hidden">
        {/* Subscription Prompt for Likes */}
        {showLikePrompt && (
          <div className="max-w-sm w-full mb-4">
            <SubscriptionPrompt 
              feature="likes"
              variant="banner"
              onDismiss={() => setShowLikePrompt(false)}
            />
          </div>
        )}
        
        {loading ? (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center space-y-6 max-w-sm">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">No Properties Available</h2>
              <p className="text-muted-foreground">
                There are no approved properties in the database yet. Properties need to be added and approved by admins before they appear here.
              </p>
            </div>
            
            <Button onClick={fetchProperties} variant="outline">
              Refresh
            </Button>
          </div>
        ) : currentIndex >= properties.length ? (
          <div className="text-center space-y-6 max-w-sm">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">You've seen them all!</h2>
              <p className="text-muted-foreground">
                You've viewed all available properties in {selectedLocation}. Try searching in a different location or check back later for new listings.
              </p>
            </div>
            
            <Button onClick={() => setCurrentIndex(0)} variant="outline">
              Start Over
            </Button>
          </div>
        ) : (
          <div className="max-w-sm w-full">
            <Card className={`
              relative overflow-hidden bg-card shadow-card rounded-2xl border-0 h-[500px]
              ${isAnimating && swipeDirection === 'left' ? 'animate-swipe-left' : ''}
              ${isAnimating && swipeDirection === 'right' ? 'animate-swipe-right' : ''}
            `}>
              <div className="relative h-64">
                <img 
                  src={properties[currentIndex].images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=600&fit=crop"} 
                  alt={properties[currentIndex].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-sm font-semibold text-primary">{formatPrice(properties[currentIndex].price)}</span>
                </div>
              </div>
              
              <div className="p-4 h-[236px] flex flex-col">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-foreground truncate">{properties[currentIndex].title}</h3>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="text-sm truncate">{properties[currentIndex].city}, {properties[currentIndex].state}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    <span>{properties[currentIndex].bedrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    <span>{properties[currentIndex].bathrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    <span>{formatSquareFeet(properties[currentIndex].square_feet)} sqft</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">
                  {properties[currentIndex].description || "No description available."}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {properties[currentIndex].amenities?.slice(0, 3).map((amenity) => (
                    <span 
                      key={amenity}
                      className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs"
                    >
                      {amenity}
                    </span>
                  ))}
                  {(!properties[currentIndex].amenities || properties[currentIndex].amenities.length === 0) && (
                    <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs">
                      {properties[currentIndex].property_type}
                    </span>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSwipe('left')}
                disabled={isAnimating}
                className="rounded-full w-14 h-14 border-2 hover:bg-red-50 hover:border-red-300"
              >
                <X className="w-6 h-6 text-red-500" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSwipe('right')}
                disabled={isAnimating || (!hasUnlimitedLikes() && dailyLikesUsed >= 10)}
                className={`
                  rounded-full w-14 h-14 border-2 hover:bg-green-50 hover:border-green-300
                  ${!hasUnlimitedLikes() && dailyLikesUsed >= 10 ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {!hasUnlimitedLikes() && dailyLikesUsed >= 10 ? (
                  <Lock className="w-6 h-6 text-gray-400" />
                ) : (
                  <Heart className="w-6 h-6 text-green-500" />
                )}
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-muted-foreground text-sm">
                {properties.length - currentIndex - 1} more in {selectedLocation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;