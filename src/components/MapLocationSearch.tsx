import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Search } from 'lucide-react';
import LocationSearch from './LocationSearch';
import PropertyMap from './PropertyMap';

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

interface MapLocationSearchProps {
  onLocationChange?: (location: string, radius: number, coordinates?: { lat: number; lng: number }) => void;
  onPropertySelect?: (property: Property) => void;
  defaultLocation?: string;
  defaultRadius?: number;
}

const MapLocationSearch = ({ 
  onLocationChange, 
  onPropertySelect,
  defaultLocation = '',
  defaultRadius = 10 
}: MapLocationSearchProps) => {
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  const [selectedRadius, setSelectedRadius] = useState(defaultRadius);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-74.006, 40.7128]); // Default NYC

  // Geocode location to get coordinates using OpenStreetMap Nominatim
  const geocodeLocation = useCallback(async (location: string): Promise<[number, number] | null> => {
    if (!location) return null;

    try {
      // Use OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        return [lon, lat]; // [longitude, latitude]
      }
      
      // Fallback to some default coordinates if geocoding fails
      return [-74.006, 40.7128]; // NYC
    } catch (error) {
      console.error('Geocoding error:', error);
      return [-74.006, 40.7128]; // NYC fallback
    }
  }, []);

  const handleLocationChange = useCallback(async (location: string, radius: number) => {
    console.log('🔍 MapLocationSearch: Location changed to:', location, 'radius:', radius);
    setSelectedLocation(location);
    setSelectedRadius(radius);
    
    const coordinates = await geocodeLocation(location);
    console.log('🔍 MapLocationSearch: Geocoded coordinates [lon, lat]:', coordinates);
    
    if (coordinates) {
      setMapCenter(coordinates);
      // Convert [longitude, latitude] to {lat, lng} format for parent
      const coordsObject = coordinates ? { lat: coordinates[1], lng: coordinates[0] } : undefined;
      console.log('🔍 MapLocationSearch: Converted to {lat, lng}:', coordsObject);
      onLocationChange?.(location, radius, coordsObject);
    } else {
      console.warn('🔍 MapLocationSearch: Failed to geocode location');
      // Still notify parent even if geocoding failed
      onLocationChange?.(location, radius, undefined);
    }
  }, [onLocationChange, geocodeLocation]);

  const handleRadiusChange = useCallback((radius: number) => {
    setSelectedRadius(radius);
    if (selectedLocation && mapCenter) {
      // Convert [lon, lat] to {lat, lng} for parent
      const coordsObject = { lat: mapCenter[1], lng: mapCenter[0] };
      onLocationChange?.(selectedLocation, radius, coordsObject);
    }
  }, [selectedLocation, mapCenter, onLocationChange]);

  return (
    <div className="w-full space-y-4">
      {/* Location Search */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Search Location</h3>
          </div>
          
          <LocationSearch
            value={selectedLocation}
            onChange={handleLocationChange}
            placeholder="Search any address, city, or area..."
          />
          
          {selectedLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Searching within {selectedRadius} miles of {selectedLocation}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Map Container - Always Visible */}
      <Card className="p-0 overflow-hidden">
        <div className="h-96 md:h-[500px]">
          <PropertyMap
            center={mapCenter}
            radius={selectedRadius}
            onRadiusChange={handleRadiusChange}
            onPropertySelect={onPropertySelect}
            searchLocation={selectedLocation}
          />
        </div>
      </Card>
    </div>
  );
};

export default MapLocationSearch;