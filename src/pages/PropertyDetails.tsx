import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  User,
  Mail,
  Phone,
  DollarSign,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  unit_number?: string;
  images: string[];
  videos: string[];
  amenities: string[];
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    display_name: string;
    user_type: string;
    phone: string;
    location: string;
    bio: string;
  };
}

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles (
            id,
            display_name,
            user_type,
            phone,
            location,
            bio
          )
        `)
        .eq('id', propertyId)
        .is('deleted_at', null) // Exclude soft-deleted properties
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: "Failed to load property details",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(property.status)}
            <Badge className={getStatusColor(property.status)} variant="outline">
              {property.status}
            </Badge>
          </div>
        </div>

        {/* Property Media */}
        <div className="relative">
          {(property.images && property.images.length > 0) || (property.videos && property.videos.length > 0) ? (
            <Carousel className="w-full">
              <CarouselContent>
                {property.images?.map((image, index) => (
                  <CarouselItem key={`image-${index}`}>
                    <div className="relative">
                      <img 
                        src={image} 
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-80 object-cover"
                      />
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        Image {index + 1}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
                {property.videos?.map((video, index) => (
                  <CarouselItem key={`video-${index}`}>
                    <div className="relative">
                      <video 
                        src={video}
                        controls
                        className="w-full h-80 object-cover"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        Video {index + 1}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {((property.images?.length || 0) + (property.videos?.length || 0)) > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="w-full h-80 bg-muted flex items-center justify-center">
              <Home className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Property Content */}
        <div className="p-4 space-y-6">
          {/* Title and Price */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{property.title}</h1>
            <div className="flex items-start gap-1 text-muted-foreground mb-3">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{property.address}{property.unit_number ? `, ${property.unit_number}` : ''}, {property.city}, {property.state} {property.zip_code}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                ${property.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Property Details */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Bed className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold">{property.bedrooms || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Bedrooms</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Bath className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold">{property.bathrooms || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Bathrooms</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Square className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold">
                  {property.square_feet ? property.square_feet.toLocaleString() : 'Not specified'}
                </p>
                <p className="text-xs text-muted-foreground">Sq Ft</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Home className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold capitalize">{property.property_type === 'mixed_use' ? 'Mixed-Use' : property.property_type.replace('_', ' ')}</p>
                <p className="text-xs text-muted-foreground">Type</p>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {property.description || 'No description available.'}
            </p>
          </Card>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Owner Information */}
          {property.profiles && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Property Owner
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">
                    {property.profiles.display_name || 'Unknown Owner'}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {property.profiles.user_type}
                  </p>
                </div>
                
                {property.profiles.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{property.profiles.phone}</span>
                  </div>
                )}
                
                {property.profiles.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{property.profiles.location}</span>
                  </div>
                )}
                
                {property.profiles.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">{property.profiles.bio}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Property Timeline */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Listed</p>
                  <p className="text-muted-foreground">
                    {new Date(property.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {new Date(property.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;