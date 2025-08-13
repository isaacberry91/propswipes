import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MapPin, Bed, Bath, Square, DollarSign, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Property {
  id: string;
  title: string;
  property_type: "house" | "apartment" | "condo" | "townhouse" | "studio" | "office" | "retail" | "warehouse" | "industrial" | "land";
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  images: string[] | null;
  amenities: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PropertyManagerProps {
  onPropertyUpdate?: () => void;
}

const PropertyManager = ({ onPropertyUpdate }: PropertyManagerProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserProperties();
    }
  }, [user]);

  const fetchUserProperties = async () => {
    if (!user) return;
    
    try {
      // Get user profile first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Fetch properties owned by the user
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error loading properties",
        description: "Could not load your properties. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: Property) => {
    // Navigate to ListProperty page with property data for editing
    navigate('/list', { 
      state: { 
        editingProperty: property,
        isEditing: true 
      } 
    });
  };

  const handleView = (property: Property) => {
    // Navigate to PropertyDetails page
    navigate(`/property/${property.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Live</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">My Properties</h3>
        <Badge variant="outline">
          {properties.length} Properties
        </Badge>
      </div>

      {properties.length === 0 ? (
        <Card className="p-8 text-center">
          <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-2">No Properties Listed</h4>
          <p className="text-muted-foreground mb-4">
            You haven't listed any properties yet. Start by adding your first property!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="flex">
                <div className="relative w-48 flex-shrink-0">
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Home className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(property.status)}
                  </div>
                </div>
                
                <div className="flex-1 p-6 min-w-0">
                  <div className="flex flex-col h-full">
                    {/* Header Section */}
                    <div className="flex-1 space-y-3">
                      <h4 className="font-semibold text-xl text-foreground line-clamp-1">
                        {property.title}
                      </h4>
                      
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {property.address}, {property.city}, {property.state}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
                        <DollarSign className="w-6 h-6" />
                        <span>${property.price.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Features Section - with wrapping */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground py-4">
                      {property.bedrooms && (
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4" />
                          <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-2">
                          <Bath className="w-4 h-4" />
                          <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {property.square_feet && (
                        <div className="flex items-center gap-2">
                          <Square className="w-4 h-4" />
                          <span>{property.square_feet.toLocaleString()} sq ft</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Buttons Section */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(property)}
                        className="flex-1 h-9"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleEdit(property)}
                        className="flex-1 h-9"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyManager;