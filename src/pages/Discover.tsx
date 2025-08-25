import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Bed, Bath, Square, Crown, Lock } from "lucide-react"; // Force rebuild to clear cache
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SearchFiltersComponent from "@/components/SearchFilters";
import LocationSearch from "@/components/LocationSearch";
import PropertyMap from "@/components/PropertyMap";
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

interface SearchFiltersType {
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  sqftRange: [number, number];
  yearBuilt: [number, number];
  features: string[];
  sortBy: string;
}

const Discover = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({
    priceRange: [200000, 2000000],
    bedrooms: 'any',
    bathrooms: 'any',
    propertyType: 'any',
    sqftRange: [500, 15000],
    yearBuilt: [1950, 2024],
    features: [],
    sortBy: 'relevant'
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0);
  const [showLikePrompt, setShowLikePrompt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, hasUnlimitedLikes } = useSubscription();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-74.006, 40.7128]); // Default NYC

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Debug effect to track selectedRadius changes
  useEffect(() => {
    console.log('🔍 Discover: selectedRadius state changed to:', selectedRadius);
  }, [selectedRadius]);

  useEffect(() => {
    if (user && userProfile) {
      fetchProperties();
    }
  }, [user, userProfile, selectedLocation, selectedRadius, searchFilters]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    console.log('🔄 PROFILE: fetchUserProfile called');
    console.log('🔄 PROFILE: Current dailyLikesUsed state:', dailyLikesUsed);
    
    try {
      // Use upsert to safely create or reactivate a profile without overriding likes data
      const payload: any = {
        user_id: user.id,
        display_name: (user.user_metadata as any)?.display_name || user.email?.split('@')[0] || null,
        user_type: (user.user_metadata as any)?.user_type || 'buyer',
        phone: (user.user_metadata as any)?.phone || null,
        location: (user.user_metadata as any)?.location || null,
        deleted_at: null,
        // DO NOT include daily_likes_used or daily_likes_reset_date in upsert
        // These should only be updated by the likes tracking logic
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) {
        console.error('Discover: upsert profile error:', error);
        return;
      }

      console.log('🔄 PROFILE: Database profile data:', {
        daily_likes_used: data.daily_likes_used,
        daily_likes_reset_date: data.daily_likes_reset_date
      });

      setUserProfile(data);

      // Set user's location as default search location if available
      if (data?.location && !selectedLocation) {
        setSelectedLocation(data.location);
      } else if (!selectedLocation) {
        // Fallback to Seattle, WA if no user location
        setSelectedLocation("Seattle, WA");
      }

      // 24-hour likes timer logic - only for non-subscribers
      if (!hasUnlimitedLikes()) {
        const now = new Date();
        const likesStartedAt = data.daily_likes_started_at ? new Date(data.daily_likes_started_at) : null;
        
        console.log('🔄 PROFILE: Checking 24hr timer - now:', now.toISOString(), 'started:', likesStartedAt?.toISOString());
        
        // Check if 24 hours have passed since likes started
        if (likesStartedAt && (now.getTime() - likesStartedAt.getTime()) >= 24 * 60 * 60 * 1000) {
          console.log('🔄 PROFILE: 24 hours passed, resetting likes counter');
          await supabase
            .from('profiles')
            .update({ 
              daily_likes_used: 0, 
              daily_likes_started_at: null // Reset the timer
            })
            .eq('id', data.id);
          setDailyLikesUsed(0);
        } else {
          // Timer still active or not started - use database value
          console.log('🔄 PROFILE: Using current database value:', data.daily_likes_used);
          setDailyLikesUsed(data.daily_likes_used || 0);
        }
      } else {
        // For subscribers, set unlimited likes (no tracking needed)
        console.log('🔄 PROFILE: User has unlimited likes (subscriber)');
        setDailyLikesUsed(0);
      }
    } catch (e) {
      console.error('Unexpected error in fetchUserProfile:', e);
    }
  };
  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to geocode an address
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Simple geocoding using a free service (you may want to use a more robust solution)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      if (!userProfile) {
        setProperties([]);
        setLoading(false);
        return;
      }

      // 1) Get all property IDs the user has already swiped (liked or disliked)
      const { data: swipes, error: swipesError } = await supabase
        .from('property_swipes')
        .select('property_id')
        .eq('user_id', userProfile.id);

      if (swipesError) {
        console.error('Error fetching user swipes:', swipesError);
        setLoading(false);
        return;
      }

      const swipedIds = (swipes || []).map((s: any) => s.property_id);

      // 2) Build query with location and filters
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .is('deleted_at', null);

      // Note: We no longer apply server-side text filtering by location to avoid missing
      // results due to formatting or abbreviation differences. We fetch a broader set and
      // filter by radius/text client-side below.

      // Price range filtering - only apply if user has changed from defaults
      if (searchFilters.priceRange[0] > 200000 || searchFilters.priceRange[1] < 2000000) {
        query = query.gte('price', searchFilters.priceRange[0]).lte('price', searchFilters.priceRange[1]);
      }

      // Property type filtering
      if (searchFilters.propertyType !== 'any') {
        query = query.eq('property_type', searchFilters.propertyType as any);
      }

      // Bedrooms filtering
      if (searchFilters.bedrooms !== 'any') {
        if (searchFilters.bedrooms === 'studio') {
          query = query.or('bedrooms.is.null,bedrooms.eq.0');
        } else {
          const bedroomCount = parseInt(searchFilters.bedrooms);
          if (!isNaN(bedroomCount)) {
            query = query.gte('bedrooms', bedroomCount);
          }
        }
      }

      // Bathrooms filtering
      if (searchFilters.bathrooms !== 'any') {
        const bathroomCount = parseFloat(searchFilters.bathrooms);
        if (!isNaN(bathroomCount)) {
          query = query.gte('bathrooms', bathroomCount);
        }
      }

      // Square footage filtering
      if (searchFilters.sqftRange[0] !== 500 || searchFilters.sqftRange[1] !== 15000) {
        query = query.gte('square_feet', searchFilters.sqftRange[0]).lte('square_feet', searchFilters.sqftRange[1]);
      }

      // Exclude properties the user has already swiped
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      // Exclude user's own properties
      query = query.not('owner_id', 'eq', userProfile.id);


      // Sorting
      switch (searchFilters.sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'sqft-large':
          query = query.order('square_feet', { ascending: false });
          break;
        case 'sqft-small':
          query = query.order('square_feet', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Limit results (fetch more when a location is specified to allow client-side radius filtering)
      if (selectedLocation && selectedLocation !== 'All') {
        query = query.limit(500);
      } else {
        query = query.limit(20);
      }

      console.log('🔍 About to execute property query with filters:', {
        selectedLocation,
        selectedRadius,
        priceRange: searchFilters.priceRange,
        propertyType: searchFilters.propertyType,
        bedrooms: searchFilters.bedrooms,
        bathrooms: searchFilters.bathrooms
      });

      const { data, error } = await query;

      console.log('🔍 Database query result:', {
        error,
        dataLength: data?.length || 0,
        sampleData: data?.slice(0, 2) || []
      });

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error loading properties",
          description: "Failed to load properties. Please try again.",
          variant: "destructive",
          duration: 5000
        });
        setProperties([]);
      } else {
        let filteredData = data || [];
        console.log('🔍 Before location filtering:', filteredData.length);

        // Location-based radius filtering (client-side) - improved for current location
        if (selectedLocation && selectedLocation !== 'All') {
          let searchCoords: { lat: number; lng: number } | null = null;
          
          // Check if this is a current location with embedded coordinates
          if (selectedLocation.includes('Current Location')) {
            const coordMatch = selectedLocation.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
            if (coordMatch) {
              searchCoords = {
                lat: parseFloat(coordMatch[1]),
                lng: parseFloat(coordMatch[2])
              };
              console.log('🔍 Using embedded coordinates from Current Location:', searchCoords);
            } else if ((window as any).currentLocationCoords) {
              // Fallback to stored coordinates
              searchCoords = (window as any).currentLocationCoords;
              console.log('🔍 Using stored current location coordinates:', searchCoords);
            }
          } else {
            // Use geocoding for regular locations
            searchCoords = await geocodeAddress(selectedLocation);
            console.log('🔍 Geocoding result for', selectedLocation, ':', searchCoords);
          }
          
          if (searchCoords) {
            // Filter properties within radius, but include fallbacks
            filteredData = filteredData.filter((property: any) => {
              // If property has coordinates, check distance
              if (property.latitude && property.longitude) {
                const distance = calculateDistance(
                  searchCoords!.lat, 
                  searchCoords!.lng, 
                  property.latitude, 
                  property.longitude
                );
                console.log('🔍 Distance to property:', property.title, distance, 'miles (radius:', selectedRadius, ')');
                if (distance <= selectedRadius) {
                  return true;
                }
              }
              
              // For non-current location searches, include text-based matches as fallback
              if (!selectedLocation.includes('Current Location')) {
                const searchTerm = selectedLocation.toLowerCase();
                const searchParts = searchTerm.split(',').map(part => part.trim());
                
                const addressMatch = property.address?.toLowerCase().includes(searchTerm);
                const cityMatch = property.city?.toLowerCase().includes(searchParts[0]);
                const stateMatch = searchParts[1] ? 
                  property.state?.toLowerCase().includes(searchParts[1]) : 
                  property.state?.toLowerCase().includes(searchParts[0]);
                
                // Include if any part matches
                return addressMatch || cityMatch || stateMatch;
              }
              
              return false;
            });
          } else {
            // More generous text-based search if geocoding fails
            filteredData = filteredData.filter((property: any) => {
              const searchTerm = selectedLocation.toLowerCase();
              const searchParts = searchTerm.split(',').map(part => part.trim());
              
              const addressMatch = property.address?.toLowerCase().includes(searchTerm);
              const cityMatch = property.city?.toLowerCase().includes(searchParts[0]);
              const stateMatch = searchParts.length > 1 ? 
                property.state?.toLowerCase().includes(searchParts[1]) : 
                property.state?.toLowerCase().includes(searchParts[0]);
              
              return addressMatch || cityMatch || stateMatch;
            });
          }
          console.log('🔍 After location filtering:', filteredData.length);
        }

        // Features/amenities filtering (client-side) - only apply if features are selected
        if (searchFilters.features.length > 0) {
          console.log('🔍 Before features filtering:', filteredData.length);
          filteredData = filteredData.filter((property: any) => {
            const propertyFeatures = property.amenities || [];
            return searchFilters.features.some(feature => 
              propertyFeatures.some((amenity: string) => 
                amenity.toLowerCase().includes(feature.toLowerCase())
              )
            );
          });
          console.log('🔍 After features filtering:', filteredData.length);
        }

        console.log('🔍 Final filtered data count:', filteredData.length);
        setProperties(filteredData);
        console.log(`🔍 Loaded ${filteredData.length} properties for location: ${selectedLocation}`);
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
          console.log('💕 LIKE: Updating likes count from', dailyLikesUsed, 'to', newLikesUsed);
          setDailyLikesUsed(newLikesUsed);
          
          // Prepare update object
          const updateData: any = { daily_likes_used: newLikesUsed };
          
          // Start the 24-hour timer if this is their first like
          if (dailyLikesUsed === 0) {
            updateData.daily_likes_started_at = new Date().toISOString();
            console.log('💕 LIKE: Starting 24-hour timer for first like');
          }
          
          // Update using userProfile.id instead of user.id to match the correct profile
          const updateResult = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userProfile.id);  // Use profile ID, not auth user ID
          
          console.log('💕 LIKE: Database update result:', updateResult);
        }
        
        
        
        toast({
          title: "Property Saved! 📋",
          description: `${property.title} has been added to your saved properties.`,
          duration: 5000
        });
        
        // Check for potential matches
        // This would be expanded to check if the property owner also liked the user
      } else {
        toast({
          title: "Property Skipped",
          description: "Continuing your property search...",
          duration: 3000
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

  // Swipe gesture handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = 100; // Minimum distance to trigger swipe
    const { x } = dragOffset;
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        // Swiped right - like
        handleSwipe('right');
      } else {
        // Swiped left - dislike
        handleSwipe('left');
      }
    }
    
    // Reset drag state
    setDragOffset({ x: 0, y: 0 });
    setDragStart({ x: 0, y: 0 });
  };

  const getPropertiesForLocation = async (location: string, radius: number) => {
    console.log('🔍 Getting properties for location:', { location, radius });
    setSelectedLocation(location);
    setSelectedRadius(radius);
    setCurrentIndex(0);
    
    // Geocode the location to get coordinates for map
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lon, lat]);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    // The main fetchProperties function will handle the filtering based on the new selectedLocation
  };

  const handleRadiusChange = (newRadius: number) => {
    setSelectedRadius(newRadius);
    if (selectedLocation) {
      getPropertiesForLocation(selectedLocation, newRadius);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header - Always Visible */}
      <div className="flex-shrink-0 bg-background border-b border-border">
        <div className="max-w-md mx-auto px-2 sm:px-4 py-1.5 sm:py-2">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <img 
                src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
                alt="PropSwipes" 
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              <span className="text-sm sm:text-base font-bold text-primary">PropertyMatch</span>
              {subscription.isActive && (
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!hasUnlimitedLikes() && (
                <div className="bg-accent px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">
                  <span className="hidden sm:inline">{10 - dailyLikesUsed} views left</span>
                  <span className="sm:hidden">{10 - dailyLikesUsed} left</span>
                </div>
              )}
              <SearchFiltersComponent 
                filters={searchFilters}
                onFiltersChange={(newFilters) => {
                  console.log('🔍 Filters changed:', newFilters);
                  setSearchFilters(newFilters);
                  setCurrentIndex(0);
                }}
              />
            </div>
          </div>
          
          <LocationSearch
            value={selectedLocation}
            onChange={(location, radius) => {
              console.log('🔍 Discover: LocationSearch onChange called with:', { location, radius });
              console.log('🔍 Discover: Current selectedRadius before update:', selectedRadius);
              
              // Always update the radius if it's provided
              if (radius !== undefined && radius !== selectedRadius) {
                console.log('🔍 Discover: Setting selectedRadius to:', radius);
                setSelectedRadius(radius);
              }
              
              // Use the new radius immediately, don't wait for state update
              const radiusToUse = radius !== undefined ? radius : selectedRadius;
              getPropertiesForLocation(location, radiusToUse);
            }}
            placeholder="Search properties anywhere..."
            properties={properties}
            selectedRadius={selectedRadius}
            mapCenter={mapCenter}
            onPropertySelect={(property) => {
              // Find the property in our list and navigate to it
              const propertyIndex = properties.findIndex(p => p.id === property.id);
              if (propertyIndex !== -1) {
                setCurrentIndex(propertyIndex);
              }
            }}
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
            <Card 
              ref={cardRef}
              className={`
                relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-black/50 
                shadow-2xl border border-white/20 dark:border-gray-800/50 rounded-3xl h-[540px] cursor-grab select-none 
                transition-all duration-500 ease-out hover:shadow-3xl backdrop-blur-sm
                ${isAnimating && swipeDirection === 'left' ? 'animate-swipe-left' : ''}
                ${isAnimating && swipeDirection === 'right' ? 'animate-swipe-right' : ''}
                ${isDragging ? 'cursor-grabbing scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
              style={{
                transform: isDragging && !isAnimating ? 
                  `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.1}px) rotate(${dragOffset.x * 0.1}deg)` : 
                  'none',
                boxShadow: isDragging ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' : ''
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleDragEnd}
            >
              {/* Main Image with Elegant Overlay */}
              <div className="relative h-72 overflow-hidden rounded-t-3xl">
                <img 
                  src={properties[currentIndex].images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=600&fit=crop"} 
                  alt={properties[currentIndex].title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                
                {/* Gradient Overlay for Better Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Price Badge - Elegant Glass Morphism */}
                <div className="absolute top-5 left-5 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2 shadow-lg">
                  <span className="text-white font-bold text-lg drop-shadow-sm">{formatPrice(properties[currentIndex].price)}</span>
                </div>
                
                {/* Property Type Badge */}
                <div className="absolute top-5 right-5 bg-primary/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <span className="text-white text-sm font-medium">{properties[currentIndex].property_type}</span>
                </div>
                
                {/* Dating App Style Swipe Indicators */}
                {isDragging && dragOffset.x > 50 && (
                  <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-sm flex items-center justify-center rounded-t-3xl">
                    <div className="bg-emerald-500 rounded-full p-6 shadow-2xl animate-pulse">
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                  </div>
                )}
                {isDragging && dragOffset.x < -50 && (
                  <div className="absolute inset-0 bg-red-500/30 backdrop-blur-sm flex items-center justify-center rounded-t-3xl">
                    <div className="bg-red-500 rounded-full p-6 shadow-2xl animate-pulse">
                      <X className="w-10 h-10 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Content Section with Elegant Styling */}
              <div className="p-6 h-[268px] flex flex-col relative">
                {/* Subtle Inner Shadow for Depth */}
                <div className="absolute inset-0 rounded-b-3xl shadow-inner pointer-events-none" />
                
                {/* Title and Location */}
                <div className="mb-4 relative z-10">
                  <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">{properties[currentIndex].title}</h3>
                  <div className="flex items-center text-muted-foreground/80">
                    <div className="bg-muted/50 rounded-full p-1.5 mr-2">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{properties[currentIndex].city}, {properties[currentIndex].state}</span>
                  </div>
                </div>
                
                {/* Property Stats with Icons */}
                <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
                  <div className="bg-muted/30 rounded-xl p-3 flex flex-col items-center text-center border border-muted/20">
                    <Bed className="w-5 h-5 text-primary mb-1" />
                    <span className="text-xs text-muted-foreground font-medium">Bedrooms</span>
                    <span className="text-sm font-bold text-foreground">{properties[currentIndex].bedrooms}</span>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 flex flex-col items-center text-center border border-muted/20">
                    <Bath className="w-5 h-5 text-primary mb-1" />
                    <span className="text-xs text-muted-foreground font-medium">Bathrooms</span>
                    <span className="text-sm font-bold text-foreground">{properties[currentIndex].bathrooms}</span>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 flex flex-col items-center text-center border border-muted/20">
                    <Square className="w-5 h-5 text-primary mb-1" />
                    <span className="text-xs text-muted-foreground font-medium">Sq Ft</span>
                    <span className="text-sm font-bold text-foreground">{formatSquareFeet(properties[currentIndex].square_feet)}</span>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1 leading-relaxed relative z-10">
                  {properties[currentIndex].description || "No description available."}
                </p>
                
                {/* Amenities with Elegant Pills */}
                <div className="flex flex-wrap gap-2 relative z-10">
                  {properties[currentIndex].amenities?.slice(0, 3).map((amenity) => (
                    <div 
                      key={amenity}
                      className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm"
                    >
                      {amenity}
                    </div>
                  ))}
                  {(!properties[currentIndex].amenities || properties[currentIndex].amenities.length === 0) && (
                    <div className="bg-gradient-to-r from-accent/80 to-accent/60 text-accent-foreground px-3 py-1.5 rounded-full text-xs font-medium">
                      {properties[currentIndex].property_type}
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Dating App Style Action Buttons */}
            <div className="flex justify-center gap-6 mt-6">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => handleSwipe('left')}
                disabled={isAnimating}
                className="rounded-full w-16 h-16 shadow-lg transition-all duration-200"
              >
                <X className="w-8 h-8" />
              </Button>
              
              <Button
                variant="default"
                size="icon-lg"
                onClick={() => handleSwipe('right')}
                disabled={isAnimating || (!hasUnlimitedLikes() && dailyLikesUsed >= 10)}
                className={`
                  rounded-full w-16 h-16 shadow-lg transition-all duration-200
                  ${!hasUnlimitedLikes() && dailyLikesUsed >= 10 ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {!hasUnlimitedLikes() && dailyLikesUsed >= 10 ? (
                  <Lock className="w-8 h-8 text-white" />
                ) : (
                  <Heart className="w-8 h-8 text-white" />
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