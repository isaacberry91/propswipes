import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, Navigation, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PropertyMap from "./PropertyMap";

interface LocationSearchProps {
  value: string;
  onChange: (location: string, radius?: number) => void;
  placeholder?: string;
  onPropertySelect?: (property: any) => void;
  properties?: any[];
  selectedRadius?: number;
  mapCenter?: [number, number];
}

interface LocationSuggestion {
  address: string;
  city: string;
  state: string;
  count: number;
  full_location: string;
  lat?: number;
  lon?: number;
  isRealAddress?: boolean;
}

const LocationSearch = ({ 
  value, 
  onChange, 
  placeholder = "Search any address, city, or area...", 
  onPropertySelect,
  properties = [],
  selectedRadius: propRadius = 10,
  mapCenter: propMapCenter = [-74.006, 40.7128]
}: LocationSearchProps) => {
  const [searchValue, setSearchValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(propRadius);
  const [mapCenter, setMapCenter] = useState<[number, number]>(propMapCenter);
  const [databaseSuggestions, setDatabaseSuggestions] = useState<LocationSuggestion[]>([]);
  const [popularLocations, setPopularLocations] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches] = useState([
    "1234 Main St, Seattle, WA", "456 Oak Ave, Portland, OR", "789 Pine St, San Francisco, CA"
  ]);

  // Update internal state when props change
  useEffect(() => {
    setSelectedRadius(propRadius);
  }, [propRadius]);

  useEffect(() => {
    setMapCenter(propMapCenter);
  }, [propMapCenter]);

  // Real address search using Mapbox Geocoding API
  const searchLocationsInDatabase = useCallback(async (query: string) => {
    console.log('🔍 SEARCH TRIGGERED with query:', query, 'length:', query.length);
    
    if (!query || query.length < 2) {
      console.log('🔍 Query too short, clearing suggestions');
      setDatabaseSuggestions([]);
      return;
    }

    console.log('🔍 Starting search for:', query);
    setLoading(true);
    
    try {
      // Get Mapbox token from edge function
      const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
      const mapboxToken = tokenData?.token;

      if (!mapboxToken) {
        console.error('🔍 No Mapbox token available');
        setDatabaseSuggestions([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Making Mapbox geocoding request...');
      
      // Use Mapbox Geocoding API for real address suggestions
      const mapboxResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=US&types=address,place,locality,neighborhood&limit=8`
      );
      
      if (!mapboxResponse.ok) {
        throw new Error(`Mapbox API error: ${mapboxResponse.status}`);
      }
      
      const mapboxData = await mapboxResponse.json();
      console.log('🔍 Mapbox geocoding response:', mapboxData);

      // Process Mapbox results into suggestions
      const suggestions: LocationSuggestion[] = [];

      mapboxData.features?.forEach((feature: any) => {
        const coordinates = feature.geometry?.coordinates;
        const placeName = feature.place_name;
        const placeType = feature.place_type?.[0] || '';
        
        // Extract address components
        let address = '';
        let city = '';
        let state = '';
        
        feature.context?.forEach((context: any) => {
          if (context.id.startsWith('place.')) {
            city = context.text;
          } else if (context.id.startsWith('region.')) {
            state = context.short_code?.replace('us-', '').toUpperCase() || context.text;
          }
        });

        // For address types, use the main text as address
        if (placeType === 'address') {
          address = feature.text || '';
          if (!city && feature.properties?.address) {
            city = feature.properties.address;
          }
        } else {
          // For places/localities, use as city
          city = city || feature.text || '';
        }

        if (coordinates && coordinates.length >= 2) {
          suggestions.push({
            address: address,
            city: city,
            state: state,
            count: 0,
            full_location: placeName,
            lat: coordinates[1], // Mapbox returns [lng, lat]
            lon: coordinates[0],
            isRealAddress: true
          });
        }
      });

      // Also search our database for property-based suggestions
      const dbResponse = await supabase
        .from('properties')
        .select('address, city, state, latitude, longitude')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .or(`address.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
        .limit(5);

      console.log('🔍 Database results:', dbResponse.data);

      // Add database suggestions
      const locationMap = new Map<string, LocationSuggestion>();
      dbResponse.data?.forEach((property) => {
        const cityState = `${property.city}, ${property.state}`;
        if (cityState.toLowerCase().includes(query.toLowerCase())) {
          const existing = locationMap.get(cityState);
          locationMap.set(cityState, {
            address: '',
            city: property.city,
            state: property.state,
            count: (existing?.count || 0) + 1,
            full_location: cityState,
            lat: property.latitude,
            lon: property.longitude,
            isRealAddress: false
          });
        }
      });

      // Add database suggestions to the list
      const dbSuggestions = Array.from(locationMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      suggestions.push(...dbSuggestions);

      // Remove duplicates and limit total suggestions
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.full_location === suggestion.full_location)
        )
        .slice(0, 8);

      setDatabaseSuggestions(uniqueSuggestions);
      console.log('🔍 Final suggestions:', uniqueSuggestions);
    } catch (error) {
      console.error('🔍 Address search error:', error);
      setDatabaseSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load popular locations from database
  const loadPopularLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('city, state')
        .eq('status', 'approved')
        .is('deleted_at', null);

      if (error) {
        console.error('Error loading popular locations:', error);
        return;
      }

      // Group by city, state and count properties
      const locationMap = new Map<string, number>();
      data?.forEach((property) => {
        const cityState = `${property.city}, ${property.state}`;
        locationMap.set(cityState, (locationMap.get(cityState) || 0) + 1);
      });

      // Convert to array and sort by count, take top 8
      const popular = Array.from(locationMap.entries())
        .map(([location, count]) => {
          const [city, state] = location.split(', ');
          return {
            address: '',
            city,
            state,
            count,
            full_location: location
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setPopularLocations(popular);
    } catch (error) {
      console.error('Error loading popular locations:', error);
    }
  }, []);

  // Load popular locations on mount
  useEffect(() => {
    loadPopularLocations();
  }, [loadPopularLocations]);

  // Debounce the search
  useEffect(() => {
    console.log('🔍 DEBOUNCE EFFECT - searchValue:', searchValue, 'showSuggestions:', showSuggestions);
    
    const timeoutId = setTimeout(() => {
      console.log('🔍 DEBOUNCE TIMEOUT TRIGGERED');
      if (searchValue && showSuggestions) {
        console.log('🔍 CONDITIONS MET - Starting search...');
        searchLocationsInDatabase(searchValue);
      } else {
        console.log('🔍 CONDITIONS NOT MET - searchValue:', searchValue, 'showSuggestions:', showSuggestions);
      }
    }, 300);

    return () => {
      console.log('🔍 CLEANING UP TIMEOUT');
      clearTimeout(timeoutId);
    };
  }, [searchValue, showSuggestions, searchLocationsInDatabase]);

  const handleLocationSelect = (location: string, suggestion?: LocationSuggestion) => {
    console.log('🔍 LocationSearch: handleLocationSelect called with:', location);
    console.log('🔍 LocationSearch: Current radius:', selectedRadius);
    console.log('🔍 LocationSearch: Suggestion data:', suggestion);
    
    setSearchValue(location);
    setShowSuggestions(false);
    
    // Call onChange with the location and current radius
    onChange(location, selectedRadius);
    
    // If we have coordinates from the suggestion, use them directly
    if (suggestion?.lat && suggestion?.lon) {
      console.log('🗺️ Using coordinates from suggestion:', [suggestion.lon, suggestion.lat]);
      setMapCenter([suggestion.lon, suggestion.lat]);
    } else {
      // Fallback to geocoding
      geocodeLocationForMap(location);
    }
  };

  // Use database properties for map centering when external geocoding fails
  const geocodeLocationForMap = async (location: string) => {
    console.log('🗺️ Starting geocoding for location:', location);
    
    try {
      // First try to find coordinates from our database
      const { data: dbProperties } = await supabase
        .from('properties')
        .select('latitude, longitude, city, state, address')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .or(`address.ilike.%${location}%,city.ilike.%${location}%,state.ilike.%${location}%`)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(1);

      console.log('🗺️ Database geocoding results:', dbProperties);

      if (dbProperties && dbProperties.length > 0) {
        const property = dbProperties[0];
        const lat = property.latitude;
        const lon = property.longitude;
        
        console.log('🗺️ Using database coordinates:', { lat, lon });
        
        // Adjust radius based on location specificity
        let newRadius = selectedRadius;
        const locationLower = location.toLowerCase();
        
        if (locationLower.includes(property.address?.toLowerCase() || '')) {
          newRadius = Math.max(selectedRadius, 5); // Specific address
        } else if (locationLower.includes(property.city?.toLowerCase() || '')) {
          newRadius = Math.max(selectedRadius, 15); // City level
        } else if (locationLower.includes(property.state?.toLowerCase() || '')) {
          newRadius = Math.max(selectedRadius, 50); // State level
        }
        
        if (newRadius !== selectedRadius) {
          console.log('🔍 Adjusting radius based on location specificity:', newRadius);
          setSelectedRadius(newRadius);
          onChange(location, newRadius);
        }
        
        console.log('🗺️ Setting map center to database coordinates:', [lon, lat]);
        setMapCenter([lon, lat]);
        return;
      }

      // Fallback to default coordinates for major cities if no database match
      const cityDefaults: { [key: string]: [number, number] } = {
        'new york': [-74.006, 40.7128],
        'nyc': [-74.006, 40.7128],
        'manhattan': [-73.9857, 40.7484],
        'brooklyn': [-73.9442, 40.6782],
        'los angeles': [-118.2437, 34.0522],
        'chicago': [-87.6298, 41.8781],
        'houston': [-95.3698, 29.7604],
        'philadelphia': [-75.1652, 39.9526],
        'phoenix': [-112.0740, 33.4484],
        'san antonio': [-98.4936, 29.4241],
        'san diego': [-117.1611, 32.7157],
        'dallas': [-96.7970, 32.7767],
        'san jose': [-121.8863, 37.3382],
        'austin': [-97.7431, 30.2672],
        'woodmere': [-73.7118, 40.6323],
      };

      const locationKey = location.toLowerCase().trim();
      for (const [city, coords] of Object.entries(cityDefaults)) {
        if (locationKey.includes(city)) {
          console.log('🗺️ Using default coordinates for city:', city, coords);
          setMapCenter(coords);
          return;
        }
      }

      console.log('🗺️ No specific coordinates found, keeping current map center');
      
    } catch (error) {
      console.error('🗺️ Geocoding error:', error);
    }
  };

  // Update the selected radius and trigger onChange
  const handleRadiusChange = (newRadius: number) => {
    console.log('🔍 LocationSearch: handleRadiusChange called with:', newRadius);
    setSelectedRadius(newRadius);
    // Always trigger onChange with the new radius, even if no location is set
    onChange(searchValue || '', newRadius);
  };

  const getCurrentLocation = () => {
    console.log('📍 Getting current location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('📍 Got position:', position.coords);
          
          // Set the map center directly from GPS coordinates
          console.log('📍 Setting map center to GPS coordinates:', [position.coords.longitude, position.coords.latitude]);
          setMapCenter([position.coords.longitude, position.coords.latitude]);
          
          // Use a simple location name without external API
          const locationName = "Current Location";
          console.log('📍 Using location name:', locationName);
          
          handleLocationSelect(locationName);
        },
        (error) => {
          console.error("📍 Error getting location:", error);
          alert("Unable to access your location. Please search manually.");
        }
      );
    } else {
      console.error("📍 Geolocation is not supported by this browser.");
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const searchContainer = target.closest('.location-search-container');
      if (!searchContainer) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div className="relative w-full location-search-container">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
        <Input
          value={searchValue}
          onChange={(e) => {
            console.log('🔍 INPUT CHANGE - New value:', e.target.value);
            setSearchValue(e.target.value);
            console.log('🔍 INPUT CHANGE - Setting showSuggestions to true');
            setShowSuggestions(true);
          }}
          onFocus={() => {
            console.log('🔍 INPUT FOCUS - Setting showSuggestions to true');
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Find matching suggestion if available
              const matchingSuggestion = databaseSuggestions.find(s => 
                s.full_location.toLowerCase() === searchValue.toLowerCase()
              );
              handleLocationSelect(searchValue, matchingSuggestion);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={getCurrentLocation}
          className="absolute right-1 top-1 h-8 px-2"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {showSuggestions && (
        <Card 
          className="absolute top-full left-0 right-0 mt-1 shadow-lg z-50 max-h-[600px] overflow-y-auto bg-background border"
        >
          {/* Immediate Search Results - Show at top */}
          {searchValue && (
            <div className="p-4 border-b border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {loading ? "Searching..." : `Results for "${searchValue}" (${databaseSuggestions.length} found)`}
              </h4>
              {databaseSuggestions.length > 0 ? (
                <div className="space-y-1">
                  {databaseSuggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.full_location}-${index}`}
                      className="p-2 hover:bg-accent cursor-pointer rounded-md text-sm flex items-center justify-between group transition-colors"
                      onClick={() => {
                        handleLocationSelect(suggestion.full_location, suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{suggestion.full_location}</span>
                      </div>
                      {suggestion.count > 0 && (
                        <Badge variant="secondary" className="text-xs opacity-70 group-hover:opacity-100">
                          {suggestion.count} {suggestion.count === 1 ? 'property' : 'properties'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {loading ? "Searching..." : `No locations found matching "${searchValue}"`}
                </div>
              )}
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* Map Container */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Properties Map
              </h4>
              <div className="h-80 md:h-96 w-full rounded-lg overflow-hidden border relative">
                <PropertyMap
                  center={mapCenter}
                  radius={selectedRadius}
                  visible={showSuggestions}
                  onRadiusChange={handleRadiusChange}
                  onPropertySelect={(property) => {
                    onPropertySelect?.(property);
                    setShowSuggestions(false);
                  }}
                  searchLocation={searchValue}
                  properties={properties}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-3 right-3 z-20 rounded-full shadow-md pointer-events-auto"
                  aria-label="Properties"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Radius Selection */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Search Radius
              </h4>
              <div onClick={(e) => e.stopPropagation()}>
                <Select 
                  value={selectedRadius.toString()} 
                  onValueChange={(value) => {
                    const newRadius = parseInt(value);
                    console.log('🔍 LocationSearch: Select onValueChange triggered with value:', value);
                    console.log('🔍 LocationSearch: Parsed newRadius:', newRadius);
                    console.log('🔍 LocationSearch: Current selectedRadius before change:', selectedRadius);
                    handleRadiusChange(newRadius);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedRadius} miles
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-background border shadow-lg">
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                    <SelectItem value="100">100 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Location Option */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Quick Options
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                className="w-full justify-start"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Use Current Location
              </Button>
            </div>


            {/* Popular Locations */}
            {!searchValue && popularLocations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Popular Areas
                </h4>
                <div className="grid gap-2">
                  {popularLocations.map((location, index) => (
                     <div
                       key={`${location.full_location}-${index}`}
                       className="p-3 hover:bg-accent cursor-pointer rounded-md border border-border/50 hover:border-primary/50 transition-colors"
                       onClick={() => {
                         console.log('🔍 Popular area clicked:', location.full_location);
                         handleLocationSelect(location.full_location);
                       }}
                     >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">{location.full_location}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {location.count} {location.count === 1 ? 'property' : 'properties'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {!searchValue && recentSearches.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Recent Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((location) => (
                    <Badge
                      key={location}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleLocationSelect(location)}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchValue && !loading && databaseSuggestions.length === 0 && searchValue.length >= 2 && (
              <div className="text-center py-4">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No properties found for this location
                </p>
                <Button
                  size="sm"
                  onClick={() => handleLocationSelect(searchValue)}
                  className="text-xs"
                >
                  Search "{searchValue}" anyway
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && searchValue && (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Searching properties...</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;