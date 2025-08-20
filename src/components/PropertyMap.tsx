import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
}

const PropertyMap = ({ 
  center = [-74.006, 40.7128], 
  radius = 10, 
  onRadiusChange,
  onPropertySelect,
  searchLocation 
}: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState(radius);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const radiusLayerRef = useRef<string | null>(null);

  // Get Mapbox token from Supabase edge function
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token')
        
        if (error) {
          console.error('Error fetching Mapbox token:', error)
          return
        }
        
        if (data?.token) {
          setMapboxToken(data.token)
        }
      } catch (error) {
        console.error('Error calling Mapbox token function:', error)
      }
    }
    
    getMapboxToken()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: center,
      zoom: 12,
      attributionControl: false
    });

    // Wait for map to load before allowing sources/layers to be added
    map.current.on('load', () => {
      console.log('Map loaded successfully');
      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add attribution
    map.current.addControl(new mapboxgl.AttributionControl({
      compact: true
    }), 'bottom-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, center]);

  // Fetch properties near the location
  useEffect(() => {
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
  }, [center, selectedRadius]);

  // Add property markers to map
  useEffect(() => {
    if (!map.current || !properties.length || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'property-marker';
        markerElement.innerHTML = `
          <div class="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold border-2 border-background shadow-lg cursor-pointer hover:scale-110 transition-transform">
            $${(property.price / 1000).toFixed(0)}k
          </div>
        `;

        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([property.longitude, property.latitude])
          .addTo(map.current!);

        // Add popup on click
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div class="p-2 max-w-xs">
            <div class="flex gap-2 mb-2">
              <img src="${property.images[0] || '/placeholder.svg'}" 
                   alt="${property.title}" 
                   class="w-16 h-16 object-cover rounded-md">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm truncate">${property.title}</h3>
                <p class="text-xs text-gray-600 truncate">${property.address}</p>
                <p class="text-sm font-bold text-primary">$${property.price.toLocaleString()}</p>
              </div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>${property.bedrooms || 0} bed</span>
              <span>${property.bathrooms || 0} bath</span>
              <span>${property.square_feet || 0} sqft</span>
            </div>
          </div>
        `);

        markerElement.addEventListener('click', () => {
          marker.setPopup(popup).togglePopup();
          onPropertySelect?.(property);
        });

        markersRef.current.push(marker);
      }
    });
  }, [properties, onPropertySelect, mapLoaded]);

  // Update radius circle
  useEffect(() => {
    if (!map.current || !center || !mapLoaded) return;

    // Remove existing radius layer
    if (radiusLayerRef.current) {
      if (map.current.getLayer(radiusLayerRef.current)) {
        map.current.removeLayer(radiusLayerRef.current);
      }
      if (map.current.getSource(radiusLayerRef.current)) {
        map.current.removeSource(radiusLayerRef.current);
      }
    }

    // Create circle geometry (approximate)
    const radiusInKm = selectedRadius * 1.60934; // Convert miles to km
    const points = 64;
    const coordinates = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const latitude = center[1] + (radiusInKm / 111) * Math.cos(angle);
      const longitude = center[0] + (radiusInKm / (111 * Math.cos(center[1] * Math.PI / 180))) * Math.sin(angle);
      coordinates.push([longitude, latitude]);
    }
    coordinates.push(coordinates[0]); // Close the polygon

    const sourceId = `radius-${Date.now()}`;
    radiusLayerRef.current = sourceId;

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        },
        properties: {}
      }
    });

    map.current.addLayer({
      id: sourceId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1
      }
    });

    map.current.addLayer({
      id: `${sourceId}-outline`,
      type: 'line',
      source: sourceId,
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
    
    map.current.flyTo({
      center: center,
      zoom: 12,
      duration: 1000
    });
  }, [center]);

  const handleRadiusChange = (newRadius: number) => {
    setSelectedRadius(newRadius);
    onRadiusChange?.(newRadius);
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
      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* Token Warning */}
      {!mapboxToken && (
        <Card className="absolute bottom-4 left-4 right-4 z-10 p-4 bg-destructive/10 border-destructive/20">
          <div className="text-sm text-destructive">
            <strong>Map Loading:</strong> Fetching Mapbox configuration...
          </div>
        </Card>
      )}
    </div>
  );
};

export default PropertyMap;