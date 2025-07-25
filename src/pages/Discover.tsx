import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Bed, Bath, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SearchFilters from "@/components/SearchFilters";
import LocationSearch from "@/components/LocationSearch";

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
  const { user } = useAuth();
  const { toast } = useToast();

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
    if (isAnimating || !user || !userProfile) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    const property = properties[currentIndex];
    
    try {
      // Record the swipe
      await supabase
        .from('property_swipes')
        .insert({
          user_id: userProfile.id,
          property_id: property.id,
          is_liked: direction === 'right'
        });

      if (direction === 'right') {
        toast({
          title: "Property Liked! 💕",
          description: `You liked ${property.title}. Looking for matches...`,
        });
        
        // Check for potential matches
        // This would be expanded to check if the property owner also liked the user
      } else {
        toast({
          title: "Property Passed",
          description: "Looking for your next match...",
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

  const getPropertiesForLocation = async (location: string) => {
    setSelectedLocation(location);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .ilike('city', `%${location.split(',')[0]}%`)
        .limit(20);

      if (error) throw error;
      
      setProperties(data || []);
      setCurrentIndex(0);
      
      toast({
        title: "Location Updated! 📍",
        description: `Found ${data?.length || 0} properties in ${location}`,
      });
    } catch (error) {
      console.error('Error fetching properties by location:', error);
      toast({
        title: "Error",
        description: "Could not load properties for that location.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
      </div>
    );
  }

  if (currentIndex >= properties.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
      </div>
    );
  }

  const currentProperty = properties[currentIndex];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
                alt="PropSwipes" 
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-primary">PropSwipes</span>
            </div>
            <SearchFilters />
          </div>
          
          <LocationSearch
            value={selectedLocation}
            onChange={getPropertiesForLocation}
            placeholder="Search properties anywhere..."
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="max-w-sm w-full">
          <Card className={`
            relative overflow-hidden bg-card shadow-card rounded-2xl border-0 h-[500px]
            ${isAnimating && swipeDirection === 'left' ? 'animate-swipe-left' : ''}
            ${isAnimating && swipeDirection === 'right' ? 'animate-swipe-right' : ''}
          `}>
            <div className="relative h-64">
              <img 
                src={currentProperty.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=600&fit=crop"} 
                alt={currentProperty.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-primary">{formatPrice(currentProperty.price)}</span>
              </div>
            </div>
            
            <div className="p-4 h-[236px] flex flex-col">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-foreground truncate">{currentProperty.title}</h3>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-sm truncate">{currentProperty.city}, {currentProperty.state}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Bed className="w-4 h-4 mr-1" />
                  <span>{currentProperty.bedrooms}</span>
                </div>
                <div className="flex items-center">
                  <Bath className="w-4 h-4 mr-1" />
                  <span>{currentProperty.bathrooms}</span>
                </div>
                <div className="flex items-center">
                  <Square className="w-4 h-4 mr-1" />
                  <span>{formatSquareFeet(currentProperty.square_feet)} sqft</span>
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">
                {currentProperty.description || "No description available."}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {currentProperty.amenities?.slice(0, 3).map((amenity) => (
                  <span 
                    key={amenity}
                    className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs"
                  >
                    {amenity}
                  </span>
                ))}
                {(!currentProperty.amenities || currentProperty.amenities.length === 0) && (
                  <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs">
                    {currentProperty.property_type}
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
              disabled={isAnimating}
              className="rounded-full w-14 h-14 border-2 hover:bg-green-50 hover:border-green-300"
            >
              <Heart className="w-6 h-6 text-green-500" />
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-sm">
              {properties.length - currentIndex - 1} more in {selectedLocation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;