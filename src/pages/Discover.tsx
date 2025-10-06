import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, Bed, Bath, Square, Crown, Lock, User, Eye, Sparkles } from "lucide-react"; // Force rebuild to clear cache
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SearchFiltersComponent from "@/components/SearchFilters";
import LocationSearch from "@/components/LocationSearch";
import PropertyMap from "@/components/PropertyMap";
import SubscriptionPrompt from "@/components/SubscriptionPrompt";
import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  unit_number?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  listing_type: string;
  images: string[];
  videos: string[];
  amenities: string[];
  description: string;
  property_type: string;
  created_at: string;
  updated_at: string;
  owner_id?: string; // fallback when join is not available due to RLS
  owner?: {
    id: string;
    display_name: string;
    avatar_url: string;
    user_type: string;
    phone: string;
  };
}

interface SearchFiltersType {
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  listingType: string;
  sqftRange: [number, number];
  yearBuilt: [number, number];
  sortBy: string;
}

const Discover = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem('propswipes_selected_location') || "";
  });
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<{lat: number, lng: number} | null>(() => {
    const stored = localStorage.getItem('propswipes_selected_location_coords');
    return stored ? JSON.parse(stored) : null;
  });
  const [selectedRadius, setSelectedRadius] = useState(() => {
    const stored = localStorage.getItem('propswipes_selected_radius');
    return stored ? parseInt(stored) : 10;
  });
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({
    priceRange: [200000, 2000000],
    bedrooms: 'any',
    bathrooms: 'any',
    propertyType: 'any',
    listingType: 'any',
    sqftRange: [500, 15000],
    yearBuilt: [1950, 2024],
    sortBy: 'relevant'
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0);
  const [showLikePrompt, setShowLikePrompt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, hasUnlimitedLikes } = useSubscription();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-74.006, 40.7128]); // Default NYC
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const handleImageTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging || isAnimating) return;
    
    e.stopPropagation();
    const currentProperty = properties[currentIndex];
    const imageCount = currentProperty?.images?.length || 1;
    
    if (imageCount > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % imageCount);
    }
  }, [isDragging, isAnimating, properties, currentIndex]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Reset image index when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentIndex]);

  // Debug effect to track selectedRadius changes
  useEffect(() => {
    console.log('🔍 Discover: selectedRadius state changed to:', selectedRadius);
  }, [selectedRadius]);

  useEffect(() => {
    if (user && userProfile) {
      fetchProperties();
    }
  }, [user, userProfile, selectedLocation, selectedRadius, searchFilters]);

  // Function to create a match when someone likes a property
  const createMatch = async (userId: string, property: Property) => {
    const ownerId = property.owner?.id || (property as any).owner_id;
    console.log('🔗 Creating match between user:', userId, 'and property owner:', ownerId);
    console.log('🔗 Property owner object:', property.owner);

    if (!ownerId) {
      console.error('🚫 Cannot create match: property owner ID missing (owner join may be restricted by RLS). Property:', property);
      return;
    }

    try {
      // Check if a match already exists to avoid duplicates
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(`and(buyer_id.eq.${userId},seller_id.eq.${ownerId}),and(buyer_id.eq.${ownerId},seller_id.eq.${userId})`)
        .maybeSingle();

      if (!existingMatch && ownerId !== userId) {
        // Create the match - the person liking is the buyer, property owner is the seller
        const { data: newMatch, error: matchError } = await supabase
          .from('matches')
          .insert({
            buyer_id: userId,
            seller_id: ownerId,
            property_id: property.id
          });

        if (matchError) {
          console.error('Error creating match:', matchError);
        } else {
          console.log('🎉 Match created successfully!', newMatch);
          
          // Show success toast with match notification
          toast({
            title: "It's a Match! 🎉",
            description: `You can now chat with ${property.owner?.display_name || 'the property owner'} about this property!`,
            duration: 8000
          });
        }
      } else {
        console.log('🔗 Match already exists or owner equals user.');
      }
    } catch (error) {
      console.error('Error in createMatch:', error);
    }
  };

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

  const fetchProperties = async (locationCoords?: {lat: number, lng: number} | null) => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Use passed coordinates or fall back to stored coordinates
      const coordsToUse = locationCoords !== undefined ? locationCoords : selectedLocationCoords;
      console.log('🔍 Starting discovery fetch for user:', user.id);
      console.log('🔍 Location:', selectedLocation);
      console.log('🔍 Radius:', selectedRadius, 'miles');
      console.log('🔍 Using location coordinates:', coordsToUse);

      // Get user profile first (or use existing userProfile)
      const currentUserProfile = userProfile || (await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()).data;

      if (!currentUserProfile) {
        console.error('Error: No user profile found');
        setLoading(false);
        return;
      }

      // Get only properties the user has LIKED to exclude them (disliked properties can show again)
      const { data: swipes, error: swipesError } = await supabase
        .from('property_swipes')
        .select('property_id')
        .eq('user_id', currentUserProfile.id)
        .eq('is_liked', true); // Only exclude liked properties, allow disliked ones to show again

      if (swipesError) {
        console.error('Error fetching user liked properties:', swipesError);
        setLoading(false);
        return;
      }

      const likedPropertyIds = (swipes || []).map((s: any) => s.property_id);
      // Build optimized query with better field selection for performance
      let query = supabase
        .from('properties')
        .select(`
          id,
          owner_id,
          title,
          price,
          property_type,
          listing_type,
          bedrooms,
          bathrooms,
          square_feet,
          address,
          unit_number,
          city,
          state,
          zip_code,
          latitude,
          longitude,
          images,
          videos,
          amenities,
          description,
          created_at,
          updated_at,
          owner:profiles!owner_id (
            id,
            display_name,
            avatar_url,
            user_type,
            phone
          )
        `)
        .eq('status', 'approved')
        .is('deleted_at', null);

      // Apply all server-side filters for better performance
      if (searchFilters.priceRange[0] > 200000 || searchFilters.priceRange[1] < 2000000) {
        query = query.gte('price', searchFilters.priceRange[0]).lte('price', searchFilters.priceRange[1]);
      }

      if (searchFilters.propertyType !== 'any') {
        query = query.eq('property_type', searchFilters.propertyType as any);
      }

      if (searchFilters.listingType !== 'any') {
        console.log('🔍 Applying listing type filter:', searchFilters.listingType);
        query = query.eq('listing_type', searchFilters.listingType);
      }

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

      if (searchFilters.bathrooms !== 'any') {
        const bathroomCount = parseFloat(searchFilters.bathrooms);
        if (!isNaN(bathroomCount)) {
          query = query.gte('bathrooms', bathroomCount);
        }
      }

      if (searchFilters.sqftRange[0] !== 500 || searchFilters.sqftRange[1] !== 15000) {
        query = query.gte('square_feet', searchFilters.sqftRange[0]).lte('square_feet', searchFilters.sqftRange[1]);
      }

      // Exclude liked properties and user's own properties
      if (likedPropertyIds.length > 0) {
        query = query.not('id', 'in', `(${likedPropertyIds.join(',')})`);
      }
      query = query.not('owner_id', 'eq', currentUserProfile.id);

      // Apply sorting and pagination
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


      // Limit results based on radius - larger radius = more properties
      const limit = selectedRadius >= 1000 ? 500 : selectedRadius >= 500 ? 200 : selectedRadius >= 100 ? 100 : 50;
      query = query.limit(limit);

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
        let filteredData = data?.map((property: any) => ({
          ...property,
          owner: property.owner ? {
            id: property.owner.id,
            display_name: property.owner.display_name,
            avatar_url: property.owner.avatar_url,
            user_type: property.owner.user_type,
            phone: property.owner.phone
          } : undefined
        })) || [];

        console.log('🔍 Before location filtering:', filteredData.length);

        // Location-based radius filtering (client-side) - improved for current location
        if (selectedLocation && selectedLocation !== 'All') {
          // Use the coordinates determined at the start of this function
          const searchCoords = coordsToUse;
          
          console.log('🔍 Filtering properties by location:', selectedLocation);
          console.log('🔍 Search coordinates:', searchCoords);
          console.log('🔍 Search radius:', selectedRadius, 'miles');
          
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
              
              if (!selectedLocation.includes('Current Location')) {
                const rawState = (property.state || '').toString().trim();
                const stateLower = rawState.toLowerCase();
                const propertyStateCode = stateLower.startsWith('us-')
                  ? rawState.slice(3).toUpperCase()
                  : (rawState.length === 2
                      ? rawState.toUpperCase()
                      : (stateLower.includes('new york') ? 'NY'
                        : stateLower.includes('new jersey') ? 'NJ'
                        : rawState.toUpperCase()));
                
                const parts = selectedLocation.split(',').map((p) => p.trim());
                const stateFullToCode: Record<string, string> = { 'louisiana': 'LA', 'new york': 'NY', 'new jersey': 'NJ' };
                let wantedStateCode = '';
                for (const p of parts) {
                  if (/^[A-Za-z]{2}$/.test(p)) { wantedStateCode = p.toUpperCase(); break; }
                  const lower = p.toLowerCase();
                  for (const [name, code] of Object.entries(stateFullToCode)) {
                    if (lower.includes(name)) { wantedStateCode = code; break; }
                  }
                  if (wantedStateCode) break;
                }
                let wantedCity = '';
                if (parts.length >= 2) {
                  const first = parts[0];
                  const second = parts[1];
                  const firstLooksLikeStreet = /\d/.test(first) || /(street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|highway|hwy\.?)/i.test(first);
                  wantedCity = (firstLooksLikeStreet ? second : first).toLowerCase();
                } else if (parts[0]) {
                  wantedCity = parts[0].toLowerCase();
                }
                const cityLower = (property.city || '').toLowerCase().trim();
                
                // Matching rules:
                // - If only state provided (e.g., "NY"), match by normalized state code
                // - If city and state provided (e.g., "New York, NY"), require both city and state
                let matches = false;
                if (wantedStateCode && !wantedCity) {
                  matches = propertyStateCode === wantedStateCode;
                } else if (wantedStateCode && wantedCity) {
                  matches = propertyStateCode === wantedStateCode && cityLower.includes(wantedCity);
                } else if (!wantedStateCode && wantedCity) {
                  matches = cityLower.includes(wantedCity);
                }
                
                return matches;
              }
              
              return false;
            });
          } else {
            // More generous text-based search if geocoding fails
            filteredData = filteredData.filter((property: any) => {
              const rawState = (property.state || '').toString().trim();
              const stateLower = rawState.toLowerCase();
              const propertyStateCode = stateLower.startsWith('us-')
                ? rawState.slice(3).toUpperCase()
                : (rawState.length === 2
                    ? rawState.toUpperCase()
                    : (stateLower.includes('new york') ? 'NY'
                      : stateLower.includes('new jersey') ? 'NJ'
                      : rawState.toUpperCase()));
              
              const parts = selectedLocation.split(',').map((p) => p.trim());
              const stateFullToCode: Record<string, string> = { 'louisiana': 'LA', 'new york': 'NY', 'new jersey': 'NJ' };
              let wantedStateCode = '';
              for (const p of parts) {
                if (/^[A-Za-z]{2}$/.test(p)) { wantedStateCode = p.toUpperCase(); break; }
                const lower = p.toLowerCase();
                for (const [name, code] of Object.entries(stateFullToCode)) {
                  if (lower.includes(name)) { wantedStateCode = code; break; }
                }
                if (wantedStateCode) break;
              }
              let wantedCity = '';
              if (parts.length >= 2) {
                const first = parts[0];
                const second = parts[1];
                const firstLooksLikeStreet = /\d/.test(first) || /(street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|highway|hwy\.?)/i.test(first);
                wantedCity = (firstLooksLikeStreet ? second : first).toLowerCase();
              } else if (parts[0]) {
                wantedCity = parts[0].toLowerCase();
              }
              const cityLower = (property.city || '').toLowerCase().trim();
              
              let matches = false;
              if (wantedStateCode && !wantedCity) {
                matches = propertyStateCode === wantedStateCode;
              } else if (wantedStateCode && wantedCity) {
                matches = propertyStateCode === wantedStateCode && cityLower.includes(wantedCity);
              } else if (!wantedStateCode && wantedCity) {
                matches = cityLower.includes(wantedCity);
              }
              
              return matches;
            });
          }
          console.log('🔍 After location filtering:', filteredData.length);
        }


        console.log('🔍 Final filtered data count:', filteredData.length);
        setProperties(filteredData);
        console.log(`🔍 Loaded ${filteredData.length} properties for location: ${selectedLocation}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error loading properties",
        description: "Please try again later.",
        variant: "destructive",
      });
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
      console.log('🚀 About to record swipe to database');
      
      // First check if this user has already swiped on this property
      const { data: existingSwipe } = await supabase
        .from('property_swipes')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('property_id', property.id)
        .maybeSingle();

      if (existingSwipe) {
        // Update existing swipe
        const { data, error } = await supabase
          .from('property_swipes')
          .update({
            is_liked: direction === 'right'
          })
          .eq('user_id', userProfile.id)
          .eq('property_id', property.id);
        
        console.log('🚀 Swipe update result:', { data, error });
        
        // Check for match creation if this is now a like
        if (direction === 'right') {
          const ownerId = property.owner?.id || (property as any).owner_id;
          console.log('🔗 Creating match between user:', userProfile.id, 'and property owner:', ownerId);
          console.log('🔗 Property owner object:', property.owner);
          
          if (!ownerId) {
            console.error('🚫 Cannot create match: property owner ID missing (owner join may be restricted by RLS). Property:', property);
            return;
          }
          
          // Check if match already exists
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('*')
            .eq('property_id', property.id)
            .eq('buyer_id', userProfile.id)
            .eq('seller_id', ownerId)
            .maybeSingle();

          if (!existingMatch && ownerId !== userProfile.id) {
            const { data: matchData, error: matchError } = await supabase
              .from('matches')
              .insert({
                property_id: property.id,
                buyer_id: userProfile.id,
                seller_id: ownerId
              });
            
            console.log('🔗 Match creation result:', { matchData, matchError });
          }
        }
      } else {
        // Insert new swipe (this will trigger the match creation function)
        const { data, error } = await supabase
          .from('property_swipes')
          .insert({
            user_id: userProfile.id,
            property_id: property.id,
            is_liked: direction === 'right'
          });
        
        console.log('🚀 Swipe insert result:', { data, error });
      }

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
        
        // Create a match when user likes a property
        await createMatch(userProfile.id, property);
        
        toast({
          title: "Property Saved! 📋",
          description: `${property.title} has been added to your saved properties.`,
          duration: 5000
        });
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
    // Persist to localStorage
    localStorage.setItem('propswipes_selected_location', location);
    localStorage.setItem('propswipes_selected_radius', radius.toString());
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
    localStorage.setItem('propswipes_selected_radius', newRadius.toString());
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
                className="w-6 h-6"
              />
              <span className="text-sm sm:text-base font-bold">
                <span className="text-foreground">Prop</span><span className="text-blue-500">Swipes</span>
              </span>
              {subscription.isActive && (
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!hasUnlimitedLikes() && (
                <div className="bg-accent px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs h-8 flex items-center">
                  {10 - dailyLikesUsed} likes left
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAISearch(true)}
                className="h-8 w-8"
                title="AI Search"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
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
            onChange={(location, radius, coordinates) => {
              console.log('🔍 Discover: LocationSearch onChange called with:', { location, radius, coordinates });
              console.log('🔍 Discover: Current selectedRadius before update:', selectedRadius);
              
              // Store coordinates if provided
              if (coordinates) {
                console.log('🔍 Discover: Storing location coordinates:', coordinates);
                setSelectedLocationCoords(coordinates);
                localStorage.setItem('propswipes_selected_location_coords', JSON.stringify(coordinates));
                // Update map center for map-based components
                setMapCenter([coordinates.lng, coordinates.lat]);
              } else {
                // Clear stored coordinates if none provided
                setSelectedLocationCoords(null);
                localStorage.removeItem('propswipes_selected_location_coords');
              }
              
              // Always update the radius if it's provided
              if (radius !== undefined && radius !== selectedRadius) {
                console.log('🔍 Discover: Setting selectedRadius to:', radius);
                setSelectedRadius(radius);
              }
              
              // Update location
              setSelectedLocation(location);
              localStorage.setItem('propswipes_selected_location', location);
              setCurrentIndex(0);
              
              // Pass coordinates directly to fetchProperties to avoid race condition
              fetchProperties(coordinates);
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

      {/* Main Content Area - Dynamic Height Between Header and Bottom Nav */}
      <div 
        className="flex-1 flex flex-col items-center p-2 overflow-hidden"
        style={{
          height: 'calc(100vh - 140px - 64px)', // Subtract header height (~140px) and bottom nav height (64px)
          minHeight: '400px'
        }}
      >
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
            
            <Button onClick={() => fetchProperties()} variant="outline">
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
          <div 
            className="max-w-sm w-full flex flex-col"
            style={{
              height: 'calc(100% - 120px)', // Leave space for action buttons and margin
              maxHeight: '600px'
            }}
          >
            <Card 
              ref={cardRef}
              className={`
                relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-black/50 
                shadow-2xl border border-white/20 dark:border-gray-800/50 rounded-3xl cursor-pointer select-none 
                transition-all duration-500 ease-out hover:shadow-3xl backdrop-blur-sm flex-1
                ${isAnimating && swipeDirection === 'left' ? 'animate-swipe-left' : ''}
                ${isAnimating && swipeDirection === 'right' ? 'animate-swipe-right' : ''}
                ${isDragging ? 'cursor-grabbing scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
              style={{
                transform: isDragging && !isAnimating ? 
                  `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.1}px) rotate(${dragOffset.x * 0.1}deg)` : 
                  'none',
                boxShadow: isDragging ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' : '',
                minHeight: '400px'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleDragEnd}
              onClick={() => setSelectedProperty(properties[currentIndex])}
            >
              {/* Main Image with Elegant Overlay */}
              <div className="relative h-72 overflow-hidden rounded-t-3xl">
                <img 
                  src={properties[currentIndex].images?.[currentImageIndex] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=600&fit=crop"} 
                  alt={`${properties[currentIndex].title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageTap(e);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleImageTap(e);
                  }}
                />
                
                {/* Listing Type Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                     {properties[currentIndex].listing_type === 'for-sale' ? 'For Sale' : 'For Rent'}
                  </span>
                </div>

                {/* Gradient Overlay for Better Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Image Counter Dots */}
                {properties[currentIndex].images && properties[currentIndex].images.length > 1 && (
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    {properties[currentIndex].images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'bg-white shadow-lg scale-110' 
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Tap indicator for multiple images */}
                {properties[currentIndex].images && properties[currentIndex].images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-white text-xs font-medium">
                      {currentImageIndex + 1}/{properties[currentIndex].images.length}
                    </span>
                  </div>
                )}
                
                {/* Property Type Badge */}
                <div className="absolute bottom-4 right-4 bg-primary/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <span className="text-white text-sm font-medium">{properties[currentIndex].property_type === 'mixed_use' ? 'Mixed-Use' : properties[currentIndex].property_type.replace('_', ' ')}</span>
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
                
                {/* Title and Location with Price */}
                <div className="mb-4 relative z-10">
                  <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">{properties[currentIndex].title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-muted-foreground/80">
                      <div className="bg-muted/50 rounded-full p-1.5 mr-2">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium">{properties[currentIndex].city}, {properties[currentIndex].state}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{formatPrice(properties[currentIndex].price)}</span>
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
                
                {/* Property Lister Information */}
                {properties[currentIndex].owner && (
                  <div className="flex items-center gap-2 pt-3 border-t border-muted/20 relative z-10">
                    <Avatar className="w-8 h-8">
                      <AvatarImage 
                        src={properties[currentIndex].owner.avatar_url} 
                        alt={properties[currentIndex].owner.display_name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        Listed by {properties[currentIndex].owner.display_name || 'Property Owner'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Dating App Style Action Buttons */}
            <div className="flex justify-center gap-6 mt-6">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipe('left');
                }}
                disabled={isAnimating}
                className="rounded-full w-16 h-16 shadow-lg transition-all duration-200"
              >
                <X className="w-8 h-8" />
              </Button>
              
              <Button
                variant="outline"
                size="icon-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProperty(properties[currentIndex]);
                }}
                disabled={isAnimating}
                className="rounded-full w-12 h-12 shadow-lg transition-all duration-200 border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                <Eye className="w-6 h-6" />
              </Button>
              
              <Button
                variant="default"
                size="icon-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipe('right');
                }}
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
            
          </div>
        )}

        {/* Property Details Modal */}
        <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
          <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            {selectedProperty && (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{selectedProperty.title}</DialogTitle>
                </DialogHeader>
                
                {/* Address */}
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{selectedProperty.address}{selectedProperty.unit_number ? `, ${selectedProperty.unit_number}` : ''}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</span>
                </div>

                {/* Price */}
                <div className="text-3xl font-bold text-green-600">
                  ${selectedProperty.price.toLocaleString()}
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedProperty.bedrooms || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Bedrooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedProperty.bathrooms || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Bathrooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {selectedProperty.square_feet ? selectedProperty.square_feet.toLocaleString() : 'Not specified'}
                    </div>
                    <div className="text-xs text-muted-foreground">Sq Ft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold capitalize">{selectedProperty.property_type === 'mixed_use' ? 'Mixed-Use' : selectedProperty.property_type.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground">Type</div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedProperty.description || 'No description available.'}
                  </p>
                </div>

                {/* Amenities */}
                {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.amenities.map((amenity, index) => (
                        <span key={index} className="px-3 py-1 bg-muted text-sm rounded-md">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Owner */}
                {selectedProperty.owner && (
                  <div>
                    <h4 className="font-semibold mb-3">Property Owner</h4>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedProperty.owner.avatar_url} />
                        <AvatarFallback>
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{selectedProperty.owner.display_name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {selectedProperty.owner.user_type}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold mb-3">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Listed</span>
                      <span>{new Date(selectedProperty.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{new Date(selectedProperty.updated_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      handleSwipe('left');
                      setSelectedProperty(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Pass
                  </Button>
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      handleSwipe('right');
                      setSelectedProperty(null);
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Like
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Search Modal/Drawer */}
        {isMobile ? (
          <Drawer open={showAISearch} onOpenChange={setShowAISearch}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="space-y-1">
                <DrawerTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Property Search
                </DrawerTitle>
                <DrawerDescription>
                  Describe the property you're looking for in natural language
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-4">
                <Textarea
                  placeholder="E.g., I'm looking for a 3 bedroom apartment with a balcony near downtown, budget around $500k"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  className="min-h-[160px] resize-none text-base border-2 border-border focus-visible:border-primary"
                />
              </div>
              <DrawerFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAISearch(false);
                    setAiSearchQuery("");
                  }}
                  className="h-11"
                >
                  Cancel
                </Button>
                  <Button
                    onClick={async () => {
                      if (!user || !aiSearchQuery.trim()) return;
                      
                      try {
                        setLoading(true);
                        
                        const { data, error } = await supabase.functions.invoke('ai-property-search', {
                          body: {
                            query: aiSearchQuery,
                            userId: user.id,
                            currentFilters: {
                              priceRange: searchFilters.priceRange,
                              bedrooms: searchFilters.bedrooms !== 'any' ? searchFilters.bedrooms : undefined,
                              bathrooms: searchFilters.bathrooms !== 'any' ? searchFilters.bathrooms : undefined,
                              propertyType: searchFilters.propertyType !== 'any' ? searchFilters.propertyType : undefined,
                              listingType: searchFilters.listingType !== 'any' ? searchFilters.listingType : undefined,
                              sqftRange: searchFilters.sqftRange,
                              yearBuilt: searchFilters.yearBuilt,
                            }
                          }
                        });

                        if (error) {
                          if (error.message?.includes('429')) {
                            toast({
                              title: "Rate Limit Exceeded",
                              description: "Too many requests. Please try again in a moment.",
                              variant: "destructive"
                            });
                          } else if (error.message?.includes('402')) {
                            toast({
                              title: "Payment Required",
                              description: "AI service requires payment. Please contact support.",
                              variant: "destructive"
                            });
                          } else {
                            throw error;
                          }
                          return;
                        }

                        console.log('🤖 AI Search results:', data);

                        if (data.properties && data.properties.length > 0) {
                          setProperties(data.properties);
                          setCurrentIndex(0);
                          setCurrentImageIndex(0);
                          toast({
                            title: "Search Complete",
                            description: `Found ${data.properties.length} properties matching "${aiSearchQuery}"`,
                          });
                        } else {
                          toast({
                            title: "No Results",
                            description: "No properties found matching your search. Try adjusting your criteria.",
                            variant: "destructive"
                          });
                        }

                        setShowAISearch(false);
                        setAiSearchQuery("");
                      } catch (error) {
                        console.error('AI Search error:', error);
                        toast({
                          title: "Search Failed",
                          description: "There was an error processing your search. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={!aiSearchQuery.trim()}
                    className="h-11"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Search
                  </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={showAISearch} onOpenChange={setShowAISearch}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-4 sm:mx-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>AI Property Search</span>
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Describe the property you're looking for in natural language
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                <Textarea
                  placeholder="E.g., I'm looking for a 3 bedroom apartment with a balcony near downtown, budget around $500k"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  className="min-h-[140px] sm:min-h-[120px] resize-none text-sm sm:text-base"
                />
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAISearch(false);
                      setAiSearchQuery("");
                    }}
                    className="flex-1 h-11 sm:h-10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!user || !aiSearchQuery.trim()) return;
                      
                      try {
                        setLoading(true);
                        
                        const { data, error } = await supabase.functions.invoke('ai-property-search', {
                          body: {
                            query: aiSearchQuery,
                            userId: user.id,
                            currentFilters: {
                              priceRange: searchFilters.priceRange,
                              bedrooms: searchFilters.bedrooms !== 'any' ? searchFilters.bedrooms : undefined,
                              bathrooms: searchFilters.bathrooms !== 'any' ? searchFilters.bathrooms : undefined,
                              propertyType: searchFilters.propertyType !== 'any' ? searchFilters.propertyType : undefined,
                              listingType: searchFilters.listingType !== 'any' ? searchFilters.listingType : undefined,
                              sqftRange: searchFilters.sqftRange,
                              yearBuilt: searchFilters.yearBuilt,
                            }
                          }
                        });

                        if (error) {
                          if (error.message?.includes('429')) {
                            toast({
                              title: "Rate Limit Exceeded",
                              description: "Too many requests. Please try again in a moment.",
                              variant: "destructive"
                            });
                          } else if (error.message?.includes('402')) {
                            toast({
                              title: "Payment Required",
                              description: "AI service requires payment. Please contact support.",
                              variant: "destructive"
                            });
                          } else {
                            throw error;
                          }
                          return;
                        }

                        console.log('🤖 AI Search results:', data);

                        if (data.properties && data.properties.length > 0) {
                          setProperties(data.properties);
                          setCurrentIndex(0);
                          setCurrentImageIndex(0);
                          toast({
                            title: "Search Complete",
                            description: `Found ${data.properties.length} properties matching "${aiSearchQuery}"`,
                          });
                        } else {
                          toast({
                            title: "No Results",
                            description: "No properties found matching your search. Try adjusting your criteria.",
                            variant: "destructive"
                          });
                        }

                        setShowAISearch(false);
                        setAiSearchQuery("");
                      } catch (error) {
                        console.error('AI Search error:', error);
                        toast({
                          title: "Search Failed",
                          description: "There was an error processing your search. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={!aiSearchQuery.trim()}
                    className="flex-1 h-11 sm:h-10"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Discover;
