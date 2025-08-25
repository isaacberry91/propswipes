import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MapPin, Bed, Bath, Square, DollarSign, Home, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { adminSupabase, isAdminAuthenticated } from "@/lib/adminSupabase";
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
  adminMode?: boolean; // Add prop to indicate admin mode
}

const PropertyManager = ({ onPropertyUpdate, adminMode = false }: PropertyManagerProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if we're in admin mode or have admin authentication
  const isAdmin = adminMode || isAdminAuthenticated();
  
  useEffect(() => {
    if (isAdmin || user) {
      fetchUserProperties();
    }
  }, [user, isAdmin]);

  const fetchUserProperties = async () => {
    try {
      if (isAdmin) {
        // Admin mode: fetch all properties
        const { data, error } = await adminSupabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } else {
        // Regular user mode: fetch only user's properties
        if (!user) return;
        
        // Get user profile first
        // Get or create/reactivate user profile first
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        let profileId = profile?.id as string | undefined;

        if (!profileId) {
          // Attempt to reactivate soft-deleted profile
          await supabase.from('profiles').update({ deleted_at: null }).eq('user_id', user.id);
          const { data: reFetched } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          profileId = reFetched?.id;
        }

        if (!profileId) {
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? null,
            })
            .select('id')
            .single();
          if (insertError) {
            // if conflict, fetch again
            const { data: fetchAgain } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            profileId = fetchAgain?.id;
          } else {
            profileId = created!.id;
          }
        }

        if (!profileId) throw new Error('Profile not found');

        // Fetch properties owned by the user
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', profileId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      }
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
      // Get user profile first (reactivate/create if needed)
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id as string)
        .maybeSingle();

      if (profileError) throw profileError;

      let profileId = profile?.id as string | undefined;
      if (!profileId && user?.id) {
        await supabase.from('profiles').update({ deleted_at: null }).eq('user_id', user.id);
        const { data: reFetched } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        profileId = reFetched?.id;
      }

      if (!profileId && user?.id) {
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        if (insertError) {
          const { data: fetchAgain } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          profileId = fetchAgain?.id;
        } else {
          profileId = created!.id;
        }
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
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">My Properties</h3>
        <Badge variant="outline">
          {properties.length} Properties
        </Badge>
      </div>

      {properties.length === 0 ? (
        <div className="mx-4">
          <Card className="p-8 text-center border border-border shadow-sm">
            <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">No Properties Listed</h4>
            <p className="text-muted-foreground mb-4">
              You haven't listed any properties yet. Start by adding your first property!
            </p>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 mx-6">{/* Matched spacing between cards (space-y-6) with side margins (mx-6) */}
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* Row 1: Full-width image and status badge */}
              <div className="relative">
                {property.images && property.images.length > 0 ? (
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <Home className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(property.status, property.deleted_at)}
                </div>
              </div>

              {/* Row 2: Buttons */}
              <div className="p-4 border-b border-border">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(property)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  
                  {!property.deleted_at ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          console.log('🔧 EDIT BUTTON CLICKED!', property.id, property.title);
                          handleEdit(property);
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                     
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
                    <div className="flex-1 text-center text-sm text-muted-foreground py-2 bg-muted rounded">
                      Property Deleted
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: All details */}
              <div className={`p-4 ${property.deleted_at ? 'opacity-60' : ''}`}>
                <div className="space-y-3">
                  {/* Title and Property Type */}
                  <div>
                    <h4 className="font-semibold text-lg text-foreground line-clamp-2">
                      {property.title}
                    </h4>
                    <div className="text-sm text-primary font-medium capitalize mt-1">
                      {property.property_type}
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {property.address}, {property.city}, {property.state}
                    </span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2 text-xl font-bold text-green-600">
                    <DollarSign className="w-5 h-5" />
                    <span>{property.price.toLocaleString()}</span>
                  </div>
                  
                  {/* Features */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyManager;