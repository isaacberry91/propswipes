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
  listingType: string;
  sqftRange: [number, number];
  yearBuilt: [number, number];
  sortBy: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

const SearchFilters = ({ filters, onFiltersChange }: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const propertyTypes = [
    { value: 'any', label: 'Any Type' },
    { value: 'house', label: '🏠 House' },
    { value: 'condo', label: '🏢 Condo' },
    { value: 'townhouse', label: '🏘️ Townhouse' },
    { value: 'apartment', label: '🏬 Apartment' },
    { value: 'office', label: '🏢 Office' },
    { value: 'retail', label: '🏪 Retail' },
    { value: 'warehouse', label: '🏭 Warehouse' },
    { value: 'industrial', label: '🏗️ Industrial' },
    { value: 'mixed-use', label: '🏘️ Mixed Use' },
    { value: 'land', label: '🌿 Land' }
  ];

  const listingTypes = [
    { value: 'any', label: 'Any Listing Type' },
    { value: 'for-sale', label: '💰 For Sale' },
    { value: 'for-rent', label: '🏠 For Rent' }
  ];

  const bedroomOptions = [
    { value: 'any', label: 'Any' },
    { value: 'studio', label: 'Studio' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
    { value: '5', label: '5+' },
    { value: '6', label: '6+' }
  ];

  const bathroomOptions = [
    { value: 'any', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '1.5', label: '1.5+' },
    { value: '2', label: '2+' },
    { value: '2.5', label: '2.5+' },
    { value: '3', label: '3+' },
    { value: '3.5', label: '3.5+' },
    { value: '4', label: '4+' },
    { value: '5', label: '5+' }
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


  const resetFilters = () => {
    const defaultFilters = {
      priceRange: [200000, 2000000] as [number, number],
      bedrooms: 'any',
      bathrooms: 'any',
      propertyType: 'any',
      listingType: 'any',
      sqftRange: [500, 15000] as [number, number],
      yearBuilt: [1950, 2024] as [number, number],
      sortBy: 'relevant'
    };
    setLocalFilters(defaultFilters);
  };

  const applyFilters = () => {
    console.log('Applying filters:', localFilters);
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (localFilters.bedrooms !== 'any') count++;
    if (localFilters.bathrooms !== 'any') count++;
    if (localFilters.propertyType !== 'any') count++;
    if (localFilters.listingType !== 'any') count++;
    if (localFilters.priceRange[0] !== 200000 || localFilters.priceRange[1] !== 2000000) count++;
    if (localFilters.sqftRange[0] !== 500 || localFilters.sqftRange[1] !== 15000) count++;
    if (localFilters.yearBuilt[0] !== 1950 || localFilters.yearBuilt[1] !== 2024) count++;
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative h-8 px-2.5 text-xs">
          <SlidersHorizontal className="w-3 h-3 mr-1.5" />
          Filters
          {activeFiltersCount() > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full p-0 text-xs"
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
          {/* Listing Type - Prominent at top */}
          <div className="space-y-3">
            <Label className="flex items-center justify-center gap-2 text-base font-semibold">
              <DollarSign className="w-5 h-5" />
              Listing Type
            </Label>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <Button
                type="button"
                variant={localFilters.listingType === 'for-sale' ? 'default' : 'outline'}
                className="h-12 text-base font-medium"
                onClick={() => setLocalFilters(prev => ({ ...prev, listingType: 'for-sale' }))}
              >
                💰 For Sale
              </Button>
              <Button
                type="button"
                variant={localFilters.listingType === 'for-rent' ? 'default' : 'outline'}
                className="h-12 text-base font-medium"
                onClick={() => setLocalFilters(prev => ({ ...prev, listingType: 'for-rent' }))}
              >
                🏠 For Rent
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setLocalFilters(prev => ({ ...prev, listingType: 'any' }))}
              >
                Show All
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  type="number"
                  placeholder="Min price"
                  value={localFilters.priceRange[0]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      priceRange: [value, prev.priceRange[1]] as [number, number] 
                    }));
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      priceRange: [prev.priceRange[0], value] as [number, number] 
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Property Type
            </Label>
            <Select value={localFilters.propertyType} onValueChange={(value) => setLocalFilters(prev => ({ ...prev, propertyType: value }))}>
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

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bed className="w-4 h-4" />
                Bedrooms
              </Label>
              <Select value={localFilters.bedrooms} onValueChange={(value) => setLocalFilters(prev => ({ ...prev, bedrooms: value }))}>
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
              <Select value={localFilters.bathrooms} onValueChange={(value) => setLocalFilters(prev => ({ ...prev, bathrooms: value }))}>
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

          {/* Square Footage */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              Square Footage
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Minimum (sqft)</Label>
                <Input
                  type="number"
                  placeholder="Min sqft"
                  value={localFilters.sqftRange[0]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      sqftRange: [value, prev.sqftRange[1]] as [number, number] 
                    }));
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Maximum (sqft)</Label>
                <Input
                  type="number"
                  placeholder="Max sqft"
                  value={localFilters.sqftRange[1]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      sqftRange: [prev.sqftRange[0], value] as [number, number] 
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Year Built */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Year Built
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">From Year</Label>
                <Input
                  type="number"
                  placeholder="Min year"
                  value={localFilters.yearBuilt[0]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      yearBuilt: [value, prev.yearBuilt[1]] as [number, number] 
                    }));
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To Year</Label>
                <Input
                  type="number"
                  placeholder="Max year"
                  value={localFilters.yearBuilt[1]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      yearBuilt: [prev.yearBuilt[0], value] as [number, number] 
                    }));
                  }}
                />
              </div>
            </div>
          </div>


          {/* Sort By */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sort By
            </Label>
            <Select value={localFilters.sortBy} onValueChange={(value) => setLocalFilters(prev => ({ ...prev, sortBy: value }))}>
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
            <Button onClick={applyFilters} className="flex-1">
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