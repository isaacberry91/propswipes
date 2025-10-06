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
  unit_number?: string;
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
        
        // Fetch properties for initial view
        fetchPropertiesInBounds();
      });

      // Add listeners for map movement
      map.current.on('moveend', () => {
        fetchPropertiesInBounds();
      });

      map.current.on('zoomend', () => {
        fetchPropertiesInBounds();
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
    if (propProperties.length > 0) {
      setProperties(propProperties);
    } else if (mapLoaded) {
      fetchPropertiesInBounds();
    }
  }, [propProperties, mapLoaded]);

  // Fetch properties within current map bounds
  const fetchPropertiesInBounds = async () => {
    if (!map.current || propProperties.length > 0) return;
    
    setLoading(true);
    try {
      const bounds = map.current.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      console.log('🗺️ Fetching properties in bounds:', {
        south: sw.lat,
        west: sw.lng,
        north: ne.lat,
        east: ne.lng
      });

      // Fetch properties within bounds
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('latitude', sw.lat)
        .lte('latitude', ne.lat)
        .gte('longitude', sw.lng)
        .lte('longitude', ne.lng)
        .limit(500);

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      console.log(`🗺️ Loaded ${data?.length || 0} properties in current view`);
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <p class="text-muted-foreground text-xs mb-1 truncate">${property.address}${property.unit_number ? `, ${property.unit_number}` : ''}</p>
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

  // Update radius circle - removed since we now use viewport bounds

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
      {/* Map Controls - Updated for viewport-based loading */}
      <Card className="absolute top-4 left-4 z-10 p-3 bg-background/95 backdrop-blur" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Zoom to see properties</span>
        </div>
      </Card>

      {/* Property Count */}
      <Card className="absolute bottom-4 left-4 z-10 p-3 bg-background/95 backdrop-blur" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {loading ? 'Loading...' : `${properties.length} properties in view`}
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