import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, X, Home, MapPin, Bed, Bath, Square, ChevronDown, LogIn, UserPlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthDialog from "@/components/AuthDialog";
import SearchFilters from "@/components/SearchFilters";
import LocationSearch from "@/components/LocationSearch";

// Sample property data
const sampleProperties = [
  {
    id: 1,
    title: "Modern Downtown Condo",
    price: "$850,000",
    beds: 2,
    baths: 2,
    sqft: "1,200",
    location: "Downtown, Seattle",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=600&fit=crop",
    tags: ["Pet-Friendly", "Parking", "Gym"],
    description: "Beautiful modern condo with city views, updated kitchen, and rooftop access."
  },
  {
    id: 2,
    title: "Cozy Suburban House",
    price: "$650,000",
    beds: 3,
    baths: 2,
    sqft: "1,800",
    location: "Bellevue, WA",
    image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=400&h=600&fit=crop",
    tags: ["Garden", "Fireplace", "Garage"],
    description: "Charming family home with large backyard, perfect for entertaining."
  },
  {
    id: 3,
    title: "Luxury Waterfront Loft",
    price: "$1,200,000",
    beds: 1,
    baths: 1,
    sqft: "950",
    location: "Capitol Hill, Seattle",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=600&fit=crop",
    tags: ["Waterfront", "Loft", "Downtown"],
    description: "Stunning waterfront loft with panoramic views and high-end finishes."
  }
];

const Discover = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("Seattle, WA");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    const property = sampleProperties[currentIndex];
    
    if (direction === 'right') {
      toast({
        title: "Property Liked! 💕",
        description: `You liked ${property.title}. Looking for matches...`,
      });
    } else {
      toast({
        title: "Property Passed",
        description: "Looking for your next match...",
      });
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % sampleProperties.length);
      setIsAnimating(false);
      setSwipeDirection(null);
    }, 300);
  };

  const currentProperty = sampleProperties[currentIndex];

  // Mock function to get properties for selected location
  const getPropertiesForLocation = (location: string) => {
    // In a real app, this would fetch properties from an API based on location
    console.log(`Fetching properties for: ${location}`);
    toast({
      title: "Location Updated! 📍",
      description: `Now showing properties in ${location}`,
    });
  };

  // Show auth prompt for non-logged in users
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img 
              src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
              alt="PropSwipes" 
              className="w-16 h-16"
            />
            <h1 className="text-3xl font-bold text-primary">PropSwipes</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Find Your Perfect Property</h2>
            <p className="text-muted-foreground">
              Swipe through properties like you're dating! Create an account to start matching with your dream home.
            </p>
          </div>
          
          <div className="space-y-3">
            <AuthDialog>
              <Button size="lg" className="w-full">
                <UserPlus className="w-5 h-5 mr-2" />
                Create Account
              </Button>
            </AuthDialog>
            
            <AuthDialog>
              <Button variant="outline" size="lg" className="w-full">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </AuthDialog>
            
            <Button 
              variant="ghost" 
              onClick={() => setIsLoggedIn(true)}
              className="w-full text-sm"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
                alt="PropSwipes" 
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-primary">PropSwipes</span>
            </div>
            <SearchFilters />
          </div>
          
          <LocationSearch
            value={selectedLocation}
            onChange={(location) => {
              setSelectedLocation(location);
              getPropertiesForLocation(location);
            }}
            placeholder="Search properties anywhere..."
          />
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="max-w-sm w-full">
          <Card className={`
            relative overflow-hidden bg-card shadow-card rounded-2xl border-0 h-[500px]
            ${isAnimating && swipeDirection === 'left' ? 'animate-swipe-left' : ''}
            ${isAnimating && swipeDirection === 'right' ? 'animate-swipe-right' : ''}
          `}>
            <div className="relative h-64">
              <img 
                src={currentProperty.image} 
                alt={currentProperty.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-primary">{currentProperty.price}</span>
              </div>
            </div>
            
            <div className="p-4 h-[236px] flex flex-col">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-foreground truncate">{currentProperty.title}</h3>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-sm truncate">{currentProperty.location}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Bed className="w-4 h-4 mr-1" />
                  <span>{currentProperty.beds}</span>
                </div>
                <div className="flex items-center">
                  <Bath className="w-4 h-4 mr-1" />
                  <span>{currentProperty.baths}</span>
                </div>
                <div className="flex items-center">
                  <Square className="w-4 h-4 mr-1" />
                  <span>{currentProperty.sqft}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">{currentProperty.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {currentProperty.tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag}
                    className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-4">
            <Button
              variant="pass"
              size="icon-lg"
              onClick={() => handleSwipe('left')}
              disabled={isAnimating}
              className="rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <Button
              variant="love"
              size="icon-lg"
              onClick={() => handleSwipe('right')}
              disabled={isAnimating}
              className="rounded-full"
            >
              <Heart className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-sm">
              {sampleProperties.length - currentIndex - 1} more in {selectedLocation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;