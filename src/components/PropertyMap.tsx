import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  images: string[];
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
}

interface PropertyMapProps {
  center?: [number, number];
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  onPropertySelect?: (property: Property) => void;
  searchLocation?: string;
  properties?: Property[];
  visible?: boolean;
}

const PropertyMap = ({ 
  center = [-74.006, 40.7128], 
  radius = 10, 
  onRadiusChange,
  onPropertySelect,
  searchLocation,
  properties: propProperties = [],
  visible = true
}: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxApiToken, setMapboxApiToken] = useState<string>('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState(radius);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Use passed properties or fetch from database
  const [properties, setProperties] = useState<Property[]>(propProperties);

  // Get Mapbox API token from Supabase edge function
  useEffect(() => {
    const getMapboxApiToken = async () => {
      setTokenLoading(true);
      try {
        const cached = sessionStorage.getItem('MAPBOX_TOKEN');
        if (cached) {
          setMapboxApiToken(cached);
          return;
        }
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) {
          console.error('Error fetching Mapbox API token:', error);
          return;
        }
        if (data?.token) {
          setMapboxApiToken(data.token);
          sessionStorage.setItem('MAPBOX_TOKEN', data.token);
          if (!data.token.startsWith('pk.')) {
            setMapError('The Mapbox API token appears invalid. Please update it in Supabase.');
          }
        }
      } catch (error) {
        console.error('Error calling Mapbox API token function:', error);
      } finally {
        setTokenLoading(false);
      }
    }
    
    getMapboxApiToken()
  }, [])

  // Initialize Mapbox
  useEffect(() => {
    if (!mapboxApiToken || !mapContainer.current || mapLoaded || !visible) return;

    try {
      mapboxgl.accessToken = mapboxApiToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: center,
        zoom: 12
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
        setLoading(false);
      });

      map.current.on('error', () => {
        setMapError('Failed to initialize Mapbox. Please verify the API token.');
        setLoading(false);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize Mapbox. Please verify the API token.');
      setLoading(false);
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxApiToken, center, visible]);

  // Trigger resize when visibility changes
  useEffect(() => {
    if (visible && mapLoaded && map.current) {
      map.current.resize();
    }
  }, [visible, mapLoaded]);

  useEffect(() => {
    setProperties(propProperties);
  }, [propProperties]);

  // Helper function to geocode an address
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Simple geocoding using a free service
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

  // Fetch properties near the location (only if no properties passed)
  useEffect(() => {
    console.log('🗺️ PropertyMap: Properties effect - propProperties.length:', propProperties.length);
    if (propProperties.length > 0) {
      console.log('🗺️ PropertyMap: Using passed properties:', propProperties);
      setLoading(false);
      return;
    }
    
    console.log('🗺️ PropertyMap: No properties passed, fetching from database');
    
    const fetchProperties = async () => {
      if (!center) return;
      
      setLoading(true);
      try {
        // First get all approved properties
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'approved')
          .is('deleted_at', null);

        if (error) {
          console.error('Error fetching properties:', error);
          return;
        }

        if (!data || data.length === 0) {
          setProperties([]);
          return;
        }

        // Process properties and add coordinates if missing
        const processedProperties = await Promise.all(
          data.map(async (property) => {
            // If property already has coordinates, use them
            if (property.latitude && property.longitude) {
              return property;
            }

            // Otherwise, try to geocode the address
            try {
              const fullAddress = `${property.address}, ${property.city}, ${property.state}`;
              const coords = await geocodeAddress(fullAddress);
              
              if (coords) {
                // Update the property in the database with the coordinates
                await supabase
                  .from('properties')
                  .update({
                    latitude: coords.lat,
                    longitude: coords.lng
                  })
                  .eq('id', property.id);

                return {
                  ...property,
                  latitude: coords.lat,
                  longitude: coords.lng
                };
              }
            } catch (geocodeError) {
              console.error('Geocoding error for property:', property.id, geocodeError);
            }

            return property;
          })
        );

        // Filter properties within radius
        const radiusInDegrees = selectedRadius / 69; // Rough conversion: 1 degree ≈ 69 miles
        console.log(`🗺️ Filtering with radius: ${selectedRadius} miles (${radiusInDegrees} degrees) from center:`, center);
        
        const filteredProperties = processedProperties.filter((property) => {
          // Only include properties with valid coordinates
          if (!property.latitude || !property.longitude) {
            return false;
          }

          const distance = Math.sqrt(
            Math.pow(property.latitude - center[1], 2) + 
            Math.pow(property.longitude - center[0], 2)
          );
          
          const included = distance <= radiusInDegrees;
          if (included) {
            console.log(`🗺️ Including property: ${property.title} at distance ${distance.toFixed(4)} degrees`);
          }
          return included;
        });

        setProperties(filteredProperties);
        console.log(`🗺️ Loaded ${filteredProperties.length} properties with coordinates for search area`);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [center, selectedRadius, propProperties]);

  // Add property markers to map
  useEffect(() => {
    if (!map.current || !properties.length || !mapLoaded || !map.current.isStyleLoaded()) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        // Create custom marker element with price
        const markerElement = document.createElement('div');
        markerElement.className = 'bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform';
        markerElement.innerHTML = `$${(property.price / 1000).toFixed(0)}k`;
        
        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'bottom'
        })
        .setLngLat([property.longitude, property.latitude])
        .addTo(map.current!);

        // Create popup content
        const popupContent = `
          <div class="p-2 max-w-xs">
            <div class="flex gap-2 mb-2">
              <img src="${property.images[0] || '/placeholder.svg'}" 
                   alt="${property.title}" 
                   class="w-16 h-16 object-cover rounded">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm mb-1 truncate">${property.title}</h3>
                <p class="text-muted-foreground text-xs mb-1 truncate">${property.address}</p>
                <p class="text-primary font-bold text-sm">$${property.price.toLocaleString()}</p>
                ${property.square_feet ? `<p class="text-xs text-muted-foreground">$${Math.round(property.price / property.square_feet).toLocaleString()}/sq ft</p>` : ''}
              </div>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>${property.bedrooms || 0} bed</span>
              <span>${property.bathrooms || 0} bath</span>
              {property.square_feet && <span>${property.square_feet} sqft</span>}
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(popupContent);

        // Add click listener
        markerElement.addEventListener('click', () => {
          popup.addTo(map.current!);
          popup.setLngLat([property.longitude, property.latitude]);
          onPropertySelect?.(property);
        });

        markersRef.current.push(marker);
      }
    });
  }, [properties, onPropertySelect, mapLoaded]);

  // Update radius circle
  useEffect(() => {
    if (!map.current || !center || !mapLoaded || !map.current.isStyleLoaded()) return;

    // Remove existing radius source and layers
    try {
      if (map.current.getSource('radius-circle')) {
        map.current.removeLayer('radius-circle-fill');
        map.current.removeLayer('radius-circle-stroke');
        map.current.removeSource('radius-circle');
      }
    } catch (_e) {
      // ignore if style isn't ready yet
    }

    // Create circle geometry
    const radiusInMeters = selectedRadius * 1609.34; // Convert miles to meters
    const centerCoords = center;
    
    // Simple circle approximation
    const points = 64;
    const coords = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusInMeters * Math.cos(angle);
      const dy = radiusInMeters * Math.sin(angle);
      
      // Rough conversion - not perfect but sufficient for visualization
      const deltaLat = dy / 111320;
      const deltaLng = dx / (111320 * Math.cos(center[1] * Math.PI / 180));
      
      coords.push([center[0] + deltaLng, center[1] + deltaLat]);
    }
    coords.push(coords[0]); // Close the circle

    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      }
    });

    map.current.addLayer({
      id: 'radius-circle-fill',
      type: 'fill',
      source: 'radius-circle',
      layout: {},
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1
      }
    });

    map.current.addLayer({
      id: 'radius-circle-stroke',
      type: 'line',
      source: 'radius-circle',
      layout: {},
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-opacity': 0.5
      }
    });
  }, [center, selectedRadius, mapLoaded]);

  // Update map center when search location changes
  useEffect(() => {
    console.log('🗺️ PropertyMap: center prop changed to:', center);
    if (!map.current || !center) {
      console.log('🗺️ PropertyMap: No map or center, skipping update');
      return;
    }
    
    console.log('🗺️ PropertyMap: Calling setCenter and setZoom');
    map.current.setCenter(center);
    map.current.setZoom(12);
  }, [center]);

  const handleRadiusChange = (newRadius: number) => {
    setSelectedRadius(newRadius);
    onRadiusChange?.(newRadius);
    // Trigger resize to ensure proper layout
    if (map.current) {
      map.current.resize();
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <Card className="absolute top-4 left-4 z-10 p-3 bg-background/95 backdrop-blur" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Search Radius</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="200"
              value={selectedRadius}
              onChange={(e) => {
                const newRadius = parseInt(e.target.value) || 10;
                handleRadiusChange(newRadius);
              }}
              className="w-20 text-center"
              placeholder="10"
            />
            <span className="text-sm text-muted-foreground">mi</span>
          </div>
        </div>
      </Card>

      {/* Property Count */}
      <Card className="absolute bottom-4 left-4 z-10 p-3 bg-background/95 backdrop-blur" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {loading ? 'Loading...' : `${properties.length} properties`}
          </span>
        </div>
      </Card>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-[480px] sm:h-[560px] md:h-[640px] rounded-lg" />

      {/* API Token Warning */}
      {!tokenLoading && !mapboxApiToken && (
        <Card className="absolute bottom-4 left-4 right-4 z-10 p-4 bg-destructive/10 border-destructive/20">
          <div className="text-sm text-destructive">
            Mapbox API token not configured. Add your Mapbox API token in Supabase to enable map functionality.
          </div>
        </Card>
      )}
      {mapError && (
        <Card className="absolute bottom-4 left-4 right-4 z-10 p-4 bg-destructive/10 border-destructive/20">
          <div className="text-sm text-destructive">{mapError}</div>
        </Card>
      )}
    </div>
  );
};

export default PropertyMap;