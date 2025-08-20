import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Google Maps type declarations
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  class Map {
    constructor(element: Element, options: any);
    panTo(latLng: any): void;
    setZoom(zoom: number): void;
  }
  class Marker {
    constructor(options: any);
    setMap(map: Map | null): void;
    addListener(event: string, handler: () => void): void;
  }
  class Circle {
    constructor(options: any);
    setMap(map: Map | null): void;
  }
  class InfoWindow {
    constructor();
    setContent(content: string): void;
    open(map: Map, marker: Marker): void;
    close(): void;
  }
  class Size {
    constructor(width: number, height: number);
  }
  class Point {
    constructor(x: number, y: number);
  }
  namespace event {
    function trigger(instance: any, eventName: string): void;
  }
}

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
  const map = useRef<google.maps.Map | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState(radius);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Use passed properties or fetch from database
  const [properties, setProperties] = useState<Property[]>(propProperties);

  // Get Google Maps API key from Supabase edge function
  useEffect(() => {
    const getGoogleMapsApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token')
        
        if (error) {
          console.error('Error fetching Google Maps API key:', error)
          return
        }
        
        if (data?.token) {
          setGoogleMapsApiKey(data.token);
          if (!data.token.startsWith('AIza')) {
            setMapError('The Google Maps API key appears invalid. Please update it in Supabase.');
          }
        }
      } catch (error) {
        console.error('Error calling Google Maps API key function:', error)
      }
    }
    
    getGoogleMapsApiKey()
  }, [])

  // Load Google Maps script and initialize map
  useEffect(() => {
    if (!googleMapsApiKey || !mapContainer.current) return;

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setMapError('Failed to load Google Maps. Please verify the API key.');
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainer.current) return;

      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: center[1], lng: center[0] },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Create info window
      infoWindowRef.current = new google.maps.InfoWindow();

      setMapLoaded(true);
    };

    loadGoogleMaps();

    return () => {
      // Clean up markers and circles
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [googleMapsApiKey, center]);

  // Trigger resize when visibility changes
  useEffect(() => {
    if (visible && mapLoaded && map.current) {
      google.maps.event.trigger(map.current, 'resize');
    }
  }, [visible, mapLoaded]);
  useEffect(() => {
    setProperties(propProperties);
  }, [propProperties]);

  // Fetch properties near the location (only if no properties passed)
  useEffect(() => {
    if (propProperties.length > 0) {
      setLoading(false);
      return;
    }
    
    const fetchProperties = async () => {
      if (!center) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'approved')
          .is('deleted_at', null)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (error) {
          console.error('Error fetching properties:', error);
          return;
        }

        // Filter properties within radius (rough calculation)
        const radiusInDegrees = selectedRadius / 69; // Rough conversion: 1 degree ≈ 69 miles
        const filteredProperties = data?.filter((property) => {
          const distance = Math.sqrt(
            Math.pow(property.latitude - center[1], 2) + 
            Math.pow(property.longitude - center[0], 2)
          );
          return distance <= radiusInDegrees;
        }) || [];

        setProperties(filteredProperties);
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
    if (!map.current || !properties.length || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        // Create custom marker with price
        const marker = new google.maps.Marker({
          position: { lat: property.latitude, lng: property.longitude },
          map: map.current!,
          title: property.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="hsl(var(--primary))" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="8" font-weight="bold">
                  $${(property.price / 1000).toFixed(0)}k
                </text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
        });

        // Add click listener for info window
        marker.addListener('click', () => {
          const content = `
            <div style="padding: 8px; max-width: 250px;">
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <img src="${property.images[0] || '/placeholder.svg'}" 
                     alt="${property.title}" 
                     style="width: 64px; height: 64px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1; min-width: 0;">
                  <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${property.title}</h3>
                  <p style="font-size: 12px; color: #666; margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${property.address}</p>
                  <p style="font-size: 14px; font-weight: bold; color: hsl(var(--primary)); margin: 0;">$${property.price.toLocaleString()}</p>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                <span>${property.bedrooms || 0} bed</span>
                <span>${property.bathrooms || 0} bath</span>
                <span>${property.square_feet || 0} sqft</span>
              </div>
            </div>
          `;

          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(map.current!, marker);
          onPropertySelect?.(property);
        });

        markersRef.current.push(marker);
      }
    });
  }, [properties, onPropertySelect, mapLoaded]);

  // Update radius circle
  useEffect(() => {
    if (!map.current || !center || !mapLoaded) return;

    // Remove existing radius circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
    }

    // Create new radius circle
    const radiusInMeters = selectedRadius * 1609.34; // Convert miles to meters
    
    radiusCircleRef.current = new google.maps.Circle({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      map: map.current,
      center: { lat: center[1], lng: center[0] },
      radius: radiusInMeters
    });
  }, [center, selectedRadius, mapLoaded]);

  // Update map center when search location changes
  useEffect(() => {
    if (!map.current || !center) return;
    
    map.current.panTo({ lat: center[1], lng: center[0] });
    map.current.setZoom(12);
  }, [center]);

  const handleRadiusChange = (newRadius: number) => {
    setSelectedRadius(newRadius);
    onRadiusChange?.(newRadius);
    // Trigger resize to ensure proper layout
    if (map.current) {
      google.maps.event.trigger(map.current, 'resize');
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <Card className="absolute top-4 left-4 z-10 p-3 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Search Radius</span>
          </div>
          <Select 
            value={selectedRadius.toString()} 
            onValueChange={(value) => handleRadiusChange(parseInt(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 mi</SelectItem>
              <SelectItem value="10">10 mi</SelectItem>
              <SelectItem value="25">25 mi</SelectItem>
              <SelectItem value="50">50 mi</SelectItem>
              <SelectItem value="100">100 mi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Property Count */}
      <Card className="absolute top-4 right-4 z-10 p-3 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {loading ? 'Loading...' : `${properties.length} properties`}
          </span>
        </div>
      </Card>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-[480px] sm:h-[560px] md:h-[640px] rounded-lg" />

      {/* API Key Warning */}
      {!googleMapsApiKey && (
        <Card className="absolute bottom-4 left-4 right-4 z-10 p-4 bg-destructive/10 border-destructive/20">
          <div className="text-sm text-destructive">
            Google Maps API key not configured. Add your Google Maps API key in Supabase to enable map functionality.
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