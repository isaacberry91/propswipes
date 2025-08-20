import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [loading, setLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState(radius);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Use passed properties or fetch from database
  const [properties, setProperties] = useState<Property[]>(propProperties);

  // Get Mapbox API token from Supabase edge function
  useEffect(() => {
    const getMapboxApiToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token')
        
        if (error) {
          console.error('Error fetching Mapbox API token:', error)
          return
        }
        
        if (data?.token) {
          setMapboxApiToken(data.token);
          if (!data.token.startsWith('pk.')) {
            setMapError('The Mapbox API token appears invalid. Please update it in Supabase.');
          }
        }
      } catch (error) {
        console.error('Error calling Mapbox API token function:', error)
      }
    }
    
    getMapboxApiToken()
  }, [])

  // Initialize Mapbox
  useEffect(() => {
    if (!mapboxApiToken || !mapContainer.current || mapLoaded) return;

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
  }, [mapboxApiToken, center]);

  // Trigger resize when visibility changes
  useEffect(() => {
    if (visible && mapLoaded && map.current) {
      map.current.resize();
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
              </div>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>${property.bedrooms || 0} bed</span>
              <span>${property.bathrooms || 0} bath</span>
              <span>${property.square_feet || 0} sqft</span>
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
    if (!map.current || !center || !mapLoaded) return;

    // Remove existing radius source and layers
    if (map.current.getSource('radius-circle')) {
      map.current.removeLayer('radius-circle-fill');
      map.current.removeLayer('radius-circle-stroke');
      map.current.removeSource('radius-circle');
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
    if (!map.current || !center) return;
    
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

      {/* API Token Warning */}
      {!mapboxApiToken && (
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