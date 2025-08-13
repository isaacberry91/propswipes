import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Edit, 
  Eye, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Home, 
  Bed, 
  Bath, 
  Square,
  Plus,
  X,
  Upload,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const amenitiesList = [
    "Swimming Pool", "Fitness Center", "Parking Garage", "In-Unit Laundry", "Storage Unit", "Garden/Landscaping",
    "Balcony/Patio", "Fireplace", "Central Air/Heat", "Elevator", "Concierge", "Rooftop Access",
    "Tennis Court", "Business Center", "Conference Room", "Security System", "Doorman", "Bike Storage"
  ];

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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty({ ...property });
    setNewImages([]);
    setNewImageUrls([]);
    setIsEditDialogOpen(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentImageCount = (editingProperty?.images?.length || 0) + newImages.length;
    if (currentImageCount + files.length > 10) {
      toast({
        title: "Maximum photos reached",
        description: "You can upload up to 10 photos total.",
        variant: "destructive"
      });
      return;
    }

    const newFiles = Array.from(files);
    const newUrls: string[] = [];

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newUrls.push(e.target.result as string);
          if (newUrls.length === newFiles.length) {
            setNewImageUrls(prev => [...prev, ...newUrls]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setNewImages(prev => [...prev, ...newFiles]);
  };

  const removeExistingImage = (index: number) => {
    if (!editingProperty) return;
    const updatedImages = [...(editingProperty.images || [])];
    updatedImages.splice(index, 1);
    setEditingProperty({
      ...editingProperty,
      images: updatedImages
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    if (!editingProperty) return;
    
    const currentAmenities = editingProperty.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    setEditingProperty({
      ...editingProperty,
      amenities: updatedAmenities
    });
  };

  const handleUpdate = async () => {
    if (!editingProperty || !user) return;

    try {
      let updatedImageUrls = [...(editingProperty.images || [])];

      // Upload new images if any
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const file = newImages[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);
          
          updatedImageUrls.push(publicUrl);
        }
      }

      // Update property in database
      const { error } = await supabase
        .from('properties')
        .update({
          title: editingProperty.title,
          property_type: editingProperty.property_type,
          address: editingProperty.address,
          city: editingProperty.city,
          state: editingProperty.state,
          zip_code: editingProperty.zip_code,
          price: editingProperty.price,
          square_feet: editingProperty.square_feet,
          bedrooms: editingProperty.bedrooms,
          bathrooms: editingProperty.bathrooms,
          description: editingProperty.description,
          images: updatedImageUrls,
          amenities: editingProperty.amenities,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProperty.id);

      if (error) throw error;

      toast({
        title: "Property updated",
        description: "Your property has been updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingProperty(null);
      setNewImages([]);
      setNewImageUrls([]);
      await fetchUserProperties();
      onPropertyUpdate?.();

    } catch (error: any) {
      console.error('Error updating property:', error);
      toast({
        title: "Error updating property",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Property deleted",
        description: "Your property has been deleted successfully.",
      });

      await fetchUserProperties();
      onPropertyUpdate?.();

    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast({
        title: "Error deleting property",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative">
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
              
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg line-clamp-1">{property.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">
                        {property.address}, {property.city}, {property.state}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">
                        ${property.price.toLocaleString()}
                      </span>
                    </div>
                    {property.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    {property.square_feet && (
                      <div className="flex items-center gap-1">
                        <Square className="w-4 h-4" />
                        <span>{property.square_feet.toLocaleString()} sq ft</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Dialog open={isEditDialogOpen && editingProperty?.id === property.id} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(property)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Property</DialogTitle>
                        </DialogHeader>
                        
                        {editingProperty && (
                          <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-base">Basic Information</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Property Title</Label>
                                  <Input
                                    value={editingProperty.title}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      title: e.target.value
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Property Type</Label>
                                  <Select
                                    value={editingProperty.property_type}
                                     onValueChange={(value: "house" | "apartment" | "condo" | "townhouse") => setEditingProperty({
                                       ...editingProperty,
                                       property_type: value
                                     })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="house">House</SelectItem>
                                      <SelectItem value="apartment">Apartment</SelectItem>
                                      <SelectItem value="condo">Condo</SelectItem>
                                      <SelectItem value="townhouse">Townhouse</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Price ($)</Label>
                                  <Input
                                    type="number"
                                    value={editingProperty.price}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      price: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Square Feet</Label>
                                  <Input
                                    type="number"
                                    value={editingProperty.square_feet || ''}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      square_feet: parseInt(e.target.value) || null
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Bedrooms</Label>
                                  <Input
                                    type="number"
                                    value={editingProperty.bedrooms || ''}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      bedrooms: parseInt(e.target.value) || null
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Bathrooms</Label>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    value={editingProperty.bathrooms || ''}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      bathrooms: parseFloat(e.target.value) || null
                                    })}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Address */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-base">Address</h4>
                              
                              <div className="space-y-2">
                                <Label>Street Address</Label>
                                <Input
                                  value={editingProperty.address}
                                  onChange={(e) => setEditingProperty({
                                    ...editingProperty,
                                    address: e.target.value
                                  })}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>City</Label>
                                  <Input
                                    value={editingProperty.city}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      city: e.target.value
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>State</Label>
                                  <Input
                                    value={editingProperty.state}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      state: e.target.value
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>ZIP Code</Label>
                                  <Input
                                    value={editingProperty.zip_code}
                                    onChange={(e) => setEditingProperty({
                                      ...editingProperty,
                                      zip_code: e.target.value
                                    })}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Description */}
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={editingProperty.description || ''}
                                onChange={(e) => setEditingProperty({
                                  ...editingProperty,
                                  description: e.target.value
                                })}
                                rows={3}
                              />
                            </div>
                            
                            {/* Images */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-base">Property Photos</h4>
                              
                              <div className="grid grid-cols-3 gap-4">
                                {/* Existing Images */}
                                {editingProperty.images?.map((image, index) => (
                                  <div key={index} className="relative group">
                                    <img 
                                      src={image} 
                                      alt={`Property ${index + 1}`}
                                      className="w-full h-24 object-cover rounded border"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                                      onClick={() => removeExistingImage(index)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                                
                                {/* New Images */}
                                {newImageUrls.map((image, index) => (
                                  <div key={`new-${index}`} className="relative group">
                                    <img 
                                      src={image} 
                                      alt={`New ${index + 1}`}
                                      className="w-full h-24 object-cover rounded border border-blue-300"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                                      onClick={() => removeNewImage(index)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                    <Badge className="absolute bottom-1 left-1 text-xs bg-blue-500">New</Badge>
                                  </div>
                                ))}
                                
                                {/* Add Image Button */}
                                {((editingProperty.images?.length || 0) + newImages.length) < 10 && (
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      className="hidden"
                                    />
                                    <div className="h-24 border-2 border-dashed border-border hover:border-primary rounded flex flex-col items-center justify-center bg-background hover:bg-accent/20 transition-colors">
                                      <Plus className="w-5 h-5 mb-1 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">Add Photo</span>
                                    </div>
                                  </label>
                                )}
                              </div>
                            </div>
                            
                            {/* Amenities */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-base">Amenities & Features</h4>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {amenitiesList.map((amenity) => (
                                  <Button
                                    key={amenity}
                                    type="button"
                                    variant={editingProperty.amenities?.includes(amenity) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleAmenity(amenity)}
                                    className="justify-start text-xs h-8"
                                  >
                                    {amenity}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                              <Button onClick={handleUpdate} className="flex-1">
                                Update Property
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsEditDialogOpen(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(property.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
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
