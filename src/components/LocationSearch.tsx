import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, Target } from "lucide-react";

interface LocationSearchProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
}

const LocationSearch = ({ value, onChange, placeholder = "Search any city, state, or area..." }: LocationSearchProps) => {
  const [searchValue, setSearchValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches] = useState([
    "Seattle, WA", "Portland, OR", "San Francisco, CA", "Los Angeles, CA"
  ]);

  const popularLocations = [
    { name: "Seattle, WA", properties: "2,400+ properties" },
    { name: "Portland, OR", properties: "1,800+ properties" },
    { name: "San Francisco, CA", properties: "3,200+ properties" },
    { name: "Los Angeles, CA", properties: "5,100+ properties" },
    { name: "New York, NY", properties: "4,800+ properties" },
    { name: "Chicago, IL", properties: "2,900+ properties" },
    { name: "Austin, TX", properties: "2,100+ properties" },
    { name: "Denver, CO", properties: "1,900+ properties" }
  ];

  const allLocations = [
    "Seattle, WA", "Bellevue, WA", "Redmond, WA", "Tacoma, WA", "Spokane, WA",
    "Portland, OR", "Eugene, OR", "Salem, OR", "Bend, OR",
    "San Francisco, CA", "Los Angeles, CA", "San Diego, CA", "Sacramento, CA", "Oakland, CA",
    "New York, NY", "Brooklyn, NY", "Manhattan, NY", "Queens, NY", "Bronx, NY",
    "Chicago, IL", "Aurora, IL", "Rockford, IL", "Joliet, IL",
    "Houston, TX", "Dallas, TX", "Austin, TX", "San Antonio, TX", "Fort Worth, TX",
    "Phoenix, AZ", "Tucson, AZ", "Mesa, AZ", "Chandler, AZ",
    "Philadelphia, PA", "Pittsburgh, PA", "Allentown, PA",
    "Miami, FL", "Tampa, FL", "Orlando, FL", "Jacksonville, FL",
    "Atlanta, GA", "Columbus, GA", "Augusta, GA",
    "Boston, MA", "Worcester, MA", "Springfield, MA",
    "Detroit, MI", "Grand Rapids, MI", "Warren, MI",
    "Nashville, TN", "Memphis, TN", "Knoxville, TN",
    "Denver, CO", "Colorado Springs, CO", "Aurora, CO",
    "Las Vegas, NV", "Henderson, NV", "Reno, NV"
  ];

  const filteredLocations = allLocations.filter(location =>
    location.toLowerCase().includes(searchValue.toLowerCase())
  ).slice(0, 8);

  const handleLocationSelect = (location: string) => {
    setSearchValue(location);
    onChange(location);
    setShowSuggestions(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode these coordinates
          const mockLocation = "Current Location (Seattle, WA)";
          handleLocationSelect(mockLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
        <Input
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding to allow clicking on suggestions
            setTimeout(() => setShowSuggestions(false), 200);
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
        <Card className="absolute top-full left-0 right-0 mt-1 p-4 shadow-lg z-50 max-h-96 overflow-y-auto bg-background border">
          <div className="space-y-4">
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

            {/* Search Results */}
            {searchValue && filteredLocations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Search Results
                </h4>
                <div className="space-y-1">
                  {filteredLocations.map((location) => (
                    <div
                      key={location}
                      className="p-2 hover:bg-accent cursor-pointer rounded-md text-sm flex items-center gap-2"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {location}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Locations */}
            {!searchValue && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Popular Areas
                </h4>
                <div className="grid gap-2">
                  {popularLocations.map((location) => (
                    <div
                      key={location.name}
                      className="p-3 hover:bg-accent cursor-pointer rounded-md border border-border/50 hover:border-primary/50 transition-colors"
                      onClick={() => handleLocationSelect(location.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">{location.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {location.properties}
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
            {searchValue && filteredLocations.length === 0 && (
              <div className="text-center py-4">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No exact matches found
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
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;