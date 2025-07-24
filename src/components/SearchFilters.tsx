import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Filter, 
  SlidersHorizontal, 
  MapPin, 
  DollarSign, 
  Home, 
  Bed, 
  Bath, 
  Square,
  Calendar,
  TrendingUp,
  X,
  Search
} from "lucide-react";

interface SearchFilters {
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  sqftRange: [number, number];
  yearBuilt: [number, number];
  features: string[];
  sortBy: string;
}

const SearchFilters = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [300000, 1500000],
    bedrooms: 'any',
    bathrooms: 'any',
    propertyType: 'any',
    sqftRange: [500, 5000],
    yearBuilt: [1950, 2024],
    features: [],
    sortBy: 'relevant'
  });

  const propertyTypes = [
    { value: 'any', label: 'Any Type' },
    { value: 'house', label: '🏠 House' },
    { value: 'condo', label: '🏢 Condo' },
    { value: 'townhouse', label: '🏘️ Townhouse' },
    { value: 'apartment', label: '🏬 Apartment' },
    { value: 'land', label: '🌿 Land' }
  ];

  const bedroomOptions = [
    { value: 'any', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
    { value: '5', label: '5+' }
  ];

  const bathroomOptions = [
    { value: 'any', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '1.5', label: '1.5+' },
    { value: '2', label: '2+' },
    { value: '2.5', label: '2.5+' },
    { value: '3', label: '3+' }
  ];

  const features = [
    { name: 'Pool', icon: '🏊' },
    { name: 'Garage', icon: '🚗' },
    { name: 'Fireplace', icon: '🔥' },
    { name: 'Garden', icon: '🌸' },
    { name: 'Balcony', icon: '🏞️' },
    { name: 'Gym', icon: '💪' },
    { name: 'Pet-Friendly', icon: '🐕' },
    { name: 'Updated Kitchen', icon: '👨‍🍳' },
    { name: 'Hardwood Floors', icon: '🪵' },
    { name: 'AC/Heating', icon: '❄️' },
    { name: 'Laundry', icon: '👕' },
    { name: 'Parking', icon: '🅿️' }
  ];

  const sortOptions = [
    { value: 'relevant', label: 'Most Relevant' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'sqft-large', label: 'Largest First' },
    { value: 'sqft-small', label: 'Smallest First' }
  ];

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  const formatSqft = (sqft: number) => {
    return `${sqft.toLocaleString()} sqft`;
  };

  const toggleFeature = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [300000, 1500000],
      bedrooms: 'any',
      bathrooms: 'any',
      propertyType: 'any',
      sqftRange: [500, 5000],
      yearBuilt: [1950, 2024],
      features: [],
      sortBy: 'relevant'
    });
  };

  const applyFilters = () => {
    console.log('Applying filters:', filters);
    setIsOpen(false);
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.bedrooms !== 'any') count++;
    if (filters.bathrooms !== 'any') count++;
    if (filters.propertyType !== 'any') count++;
    if (filters.features.length > 0) count++;
    if (filters.priceRange[0] !== 300000 || filters.priceRange[1] !== 1500000) count++;
    if (filters.sqftRange[0] !== 500 || filters.sqftRange[1] !== 5000) count++;
    if (filters.yearBuilt[0] !== 1950 || filters.yearBuilt[1] !== 2024) count++;
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount() > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search Filters
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset All
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Price Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price Range
            </Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                min={100000}
                max={3000000}
                step={25000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{formatPrice(filters.priceRange[0])}</span>
                <span>{formatPrice(filters.priceRange[1])}</span>
              </div>
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bed className="w-4 h-4" />
                Bedrooms
              </Label>
              <Select value={filters.bedrooms} onValueChange={(value) => setFilters(prev => ({ ...prev, bedrooms: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bedroomOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bath className="w-4 h-4" />
                Bathrooms
              </Label>
              <Select value={filters.bathrooms} onValueChange={(value) => setFilters(prev => ({ ...prev, bathrooms: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bathroomOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Property Type
            </Label>
            <Select value={filters.propertyType} onValueChange={(value) => setFilters(prev => ({ ...prev, propertyType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Square Footage */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              Square Footage
            </Label>
            <div className="px-2">
              <Slider
                value={filters.sqftRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sqftRange: value as [number, number] }))}
                min={200}
                max={8000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{formatSqft(filters.sqftRange[0])}</span>
                <span>{formatSqft(filters.sqftRange[1])}</span>
              </div>
            </div>
          </div>

          {/* Year Built */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Year Built
            </Label>
            <div className="px-2">
              <Slider
                value={filters.yearBuilt}
                onValueChange={(value) => setFilters(prev => ({ ...prev, yearBuilt: value as [number, number] }))}
                min={1900}
                max={2024}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{filters.yearBuilt[0]}</span>
                <span>{filters.yearBuilt[1]}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label>Features & Amenities</Label>
            <div className="grid grid-cols-3 gap-2">
              {features.map((feature) => (
                <Card
                  key={feature.name}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md hover-scale text-center ${
                    filters.features.includes(feature.name)
                      ? 'ring-2 ring-primary bg-primary/5 scale-105' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => toggleFeature(feature.name)}
                >
                  <div className="text-lg mb-1">{feature.icon}</div>
                  <div className="text-xs font-medium">{feature.name}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sort By
            </Label>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={applyFilters} className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
              <Search className="w-4 h-4 mr-2" />
              Apply Filters ({activeFiltersCount()})
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchFilters;