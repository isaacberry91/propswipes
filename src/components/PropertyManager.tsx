import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MapPin, Bed, Bath, Square, DollarSign, Home, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  deleted_at: string | null;
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
      // Get or create user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      let profileId = profile?.id as string | undefined;
      if (!profileId) {
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? null,
            user_type: (user.user_metadata as any)?.user_type ?? 'buyer',
            phone: (user.user_metadata as any)?.phone ?? null,
            location: (user.user_metadata as any)?.location ?? null,
          })
          .select('id')
          .single();
        if (insertError) throw insertError;
        profileId = created!.id;
      }

      // Fetch properties owned by the user
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', profileId)
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
    console.log('🔧 Edit button clicked for property:', property);
    // Navigate to ListProperty page with property data for editing
    navigate('/list', { 
      state: { 
        editingProperty: property,
        isEditing: true 
      } 
    });
    console.log('🔧 Navigation initiated to /list with editing data');
  };

  const handleView = (property: Property) => {
    // Navigate to PropertyDetails page
    navigate(`/property/${property.id}`);
  };

  const handleDelete = async (property: Property) => {
    try {
      // Get user profile first
      // Get or create user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id as string)
        .maybeSingle();

      if (profileError) throw profileError;

      let profileId = profile?.id as string | undefined;
      if (!profileId && user?.id) {
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        if (insertError) throw insertError;
        profileId = created!.id;
      }

      // Soft delete the property by setting deleted_at timestamp
      const { error } = await supabase
        .from('properties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', property.id)
        .eq('owner_id', profileId);

      if (error) throw error;

      toast({
        title: "Property deleted",
        description: "Your property has been deleted successfully.",
        duration: 5000
      });

      // Refresh the properties list
      fetchUserProperties();
      onPropertyUpdate?.();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Error deleting property",
        description: "Could not delete your property. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const getStatusBadge = (status: string, deletedAt: string | null) => {
    if (deletedAt) {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Deleted</Badge>;
    }
    
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
                {/* Left Side - Image and Buttons */}
                <div className="w-48 flex-shrink-0 flex flex-col">
                  <div className="relative">
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-muted flex items-center justify-center">
                        <Home className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(property.status, property.deleted_at)}
                    </div>
                  </div>
                  
                  {/* Buttons below image */}
                  <div className="p-3 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(property)}
                      className="w-full h-8 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    
                    {!property.deleted_at ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(property)}
                          className="w-full h-8 text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full h-8 text-xs"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Property</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{property.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(property)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Property
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        Property Deleted
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right Side - All Content */}
                <div className={`flex-1 p-6 min-w-0 ${property.deleted_at ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col h-full justify-between">
                    {/* Header Section */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-xl text-foreground line-clamp-2">
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
                    
                    {/* Features Section */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
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