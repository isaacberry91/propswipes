import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, MapPin, Home, Plus, X, Upload, DollarSign, Crown, Lock, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

const ListProperty = () => {
  const location = useLocation();
  const editingProperty = location.state?.editingProperty;
  const isEditing = location.state?.isEditing || false;
  
  const [formData, setFormData] = useState({
    // Required Core Fields
    title: "",
    propertyType: "",
    listingType: "for-sale",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    price: "",
    squareFeet: "",
    description: "",
    
    // Residential Specific
    bedrooms: "",
    bathrooms: "",
    parkingSpaces: "",
    yearBuilt: "",
    lotSize: "",
    hoaFees: "",
    
    // Commercial/Investment Specific
    grossIncome: "",
    expenses: "",
    capRate: "",
    
    // Rental Specific
    monthlyRent: "",
    leaseTerm: "",
    securityDeposit: "",
    availableDate: "",
    
    // Features
    amenities: [] as string[],
    appliances: [] as string[],
    features: [] as string[],
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, canListProperties } = useSubscription();
  const [currentPropertyCount, setCurrentPropertyCount] = useState(0);

  // Pre-fill form data when editing
  useEffect(() => {
    if (isEditing && editingProperty) {
      setFormData({
        title: editingProperty.title || "",
        propertyType: editingProperty.property_type || "",
        listingType: "for-sale",
        address: editingProperty.address || "",
        city: editingProperty.city || "",
        state: editingProperty.state || "",
        zipCode: editingProperty.zip_code || "",
        price: editingProperty.price?.toString() || "",
        squareFeet: editingProperty.square_feet?.toString() || "",
        description: editingProperty.description || "",
        bedrooms: editingProperty.bedrooms ? (editingProperty.bedrooms >= 5 ? "5+" : editingProperty.bedrooms.toString()) : "",
        bathrooms: editingProperty.bathrooms?.toString() || "",
        parkingSpaces: "",
        yearBuilt: "",
        lotSize: "",
        hoaFees: "",
        grossIncome: "",
        expenses: "",
        capRate: "",
        monthlyRent: "",
        leaseTerm: "",
        securityDeposit: "",
        availableDate: "",
        amenities: editingProperty.amenities || [],
        appliances: [],
        features: [],
      });
      setImageUrls(editingProperty.images || []);
    }
  }, [isEditing, editingProperty]);

  // Sample images for demo
  const sampleImages = [
    "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop"
  ];

  const amenitiesList = [
    "Swimming Pool", "Fitness Center", "Parking Garage", "In-Unit Laundry", "Storage Unit", "Garden/Landscaping",
    "Balcony/Patio", "Fireplace", "Central Air/Heat", "Elevator", "Concierge", "Rooftop Access",
    "Tennis Court", "Business Center", "Conference Room", "Security System", "Doorman", "Bike Storage"
  ];

  const appliancesList = [
    "Dishwasher", "Microwave", "Refrigerator", "Washer/Dryer Unit", "Gas Range/Oven", "Garbage Disposal", 
    "Wine Cooler", "Ice Maker", "Stainless Steel Appliances", "Energy Star Appliances", "Double Oven", "Gas Cooktop"
  ];

  const featuresList = [
    "Hardwood Floors", "Tile Flooring", "Carpet", "High Ceilings (9ft+)", "Vaulted Ceilings",
    "Crown Molding", "Walk-in Closets", "Master Suite", "Open Floor Plan", "Updated Kitchen",
    "Granite Countertops", "Stainless Steel Appliances", "Recently Renovated", "New Paint",
    "Energy Efficient Windows", "Skylight", "Bay Windows", "French Doors"
  ];

  const isResidential = ["house", "condo", "townhouse", "apartment"].includes(formData.propertyType);
  const isCommercial = ["office", "retail", "warehouse", "industrial"].includes(formData.propertyType);
  const isRental = formData.listingType === "for-rent";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to list a property.",
        variant: "destructive"
      });
      return;
    }

    // Check subscription limits
    if (!canListProperties(currentPropertyCount)) {
      const upgradeMessage = subscription.isActive 
        ? "You've reached your listing limit. Upgrade to a higher tier for more listings."
        : "Upgrade to a seller plan to list more properties and access professional tools.";
        
      toast({
        title: "Listing Limit Reached 🏠",
        description: upgradeMessage,
        variant: "destructive"
      });
      navigate('/subscription');
      return;
    }

    // Detailed validation with specific error messages
    const missingFields = [];
    
    if (!formData.title) missingFields.push("Property Title");
    if (!formData.propertyType) missingFields.push("Property Type");
    if (!formData.address) missingFields.push("Address");
    if (!formData.city) missingFields.push("City");
    if (!formData.state) missingFields.push("State");
    
    // Check price or monthly rent based on listing type
    if (isRental) {
      if (!formData.monthlyRent) missingFields.push("Monthly Rent");
    } else {
      if (!formData.price) missingFields.push("Price");
    }
    
    if (!formData.squareFeet) missingFields.push("Square Feet");
    if (!formData.description) missingFields.push("Description");
    
    // Add property type specific validations
    if (isResidential) {
      if (!formData.bedrooms) missingFields.push("Bedrooms");
      if (!formData.bathrooms) missingFields.push("Bathrooms");
    }

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    if (images.length === 0 && (!isEditing || !editingProperty?.images?.length)) {
      toast({
        title: "Add photos",
        description: "Please add at least one photo of your property.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Upload images first
      const uploadedImageUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);
        
        uploadedImageUrls.push(publicUrl);
      }

      if (isEditing && editingProperty) {
        // Update existing property
        const propertyData = {
          title: formData.title,
          property_type: formData.propertyType as "house" | "apartment" | "condo" | "townhouse" | "studio",
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          price: isRental 
            ? parseFloat(formData.monthlyRent.replace(/,/g, '')) 
            : parseFloat(formData.price.replace(/,/g, '')),
          square_feet: parseInt(formData.squareFeet.replace(/,/g, '')),
          description: formData.description,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          amenities: [...formData.amenities, ...formData.appliances, ...formData.features],
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : editingProperty.images,
          status: 'pending' as const,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingProperty.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Property Updated Successfully! 🏠",
          description: "Your property changes are pending admin approval!",
        });
      } else {
        // Create new property
        const propertyData = {
          owner_id: profile.id,
          title: formData.title,
          property_type: formData.propertyType as "house" | "apartment" | "condo" | "townhouse" | "studio",
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          price: isRental 
            ? parseFloat(formData.monthlyRent.replace(/,/g, '')) 
            : parseFloat(formData.price.replace(/,/g, '')),
          square_feet: parseInt(formData.squareFeet.replace(/,/g, '')),
          description: formData.description,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          amenities: [...formData.amenities, ...formData.appliances, ...formData.features],
          images: uploadedImageUrls,
          status: 'pending' as const
        };

        const { error: insertError } = await supabase
          .from('properties')
          .insert(propertyData);

        if (insertError) {
          throw insertError;
        }

        // Update property count in profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            properties_listed: currentPropertyCount + 1 
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating property count:', updateError);
        }

        toast({
          title: "Property Listed Successfully! 🏠",
          description: "Your property is pending approval and will be live soon!",
        });
      }

      // Reset form
      setFormData({
        title: "",
        propertyType: "",
        listingType: "for-sale",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        price: "",
        squareFeet: "",
        description: "",
        bedrooms: "",
        bathrooms: "",
        parkingSpaces: "",
        yearBuilt: "",
        lotSize: "",
        hoaFees: "",
        grossIncome: "",
        expenses: "",
        capRate: "",
        monthlyRent: "",
        leaseTerm: "",
        securityDeposit: "",
        availableDate: "",
        amenities: [],
        appliances: [],
        features: [],
      });
      setImages([]);
      setImageUrls([]);
      setCurrentStep(1);

      // Navigate back to profile or discover
      navigate(isEditing ? '/profile' : '/discover');

    } catch (error: any) {
      console.error('Error creating property:', error);
      toast({
        title: "Error creating property",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (images.length + files.length > 10) {
      toast({
        title: "Maximum photos reached",
        description: "You can upload up to 10 photos total.",
      });
      return;
    }

    const newFiles = Array.from(files);
    const newImageUrls: string[] = [];

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImageUrls.push(e.target.result as string);
          if (newImageUrls.length === newFiles.length) {
            setImageUrls(prev => [...prev, ...newImageUrls]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...newFiles]);
  };

  const handleCameraCapture = async () => {
    if (images.length >= 10) {
      toast({
        title: "Maximum photos reached",
        description: "You can upload up to 10 photos total.",
      });
      return;
    }

    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        allowEditing: true,
        saveToGallery: false
      });

      if (image.dataUrl) {
        // Convert data URL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        setImages(prev => [...prev, file]);
        setImageUrls(prev => [...prev, image.dataUrl]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGallerySelect = async () => {
    if (images.length >= 10) {
      toast({
        title: "Maximum photos reached",
        description: "You can upload up to 10 photos total.",
      });
      return;
    }

    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        allowEditing: true
      });

      if (image.dataUrl) {
        // Convert data URL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        setImages(prev => [...prev, file]);
        setImageUrls(prev => [...prev, image.dataUrl]);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      toast({
        title: "Gallery Error",
        description: "Could not access photo gallery. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addSampleImage = () => {
    if (images.length >= 10) {
      toast({
        title: "Maximum photos reached",
        description: "You can upload up to 10 photos.",
      });
      return;
    }
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setImageUrls(prev => [...prev, randomImage]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleArrayField = (field: 'amenities' | 'appliances' | 'features', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const renderPhotosSection = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Property Photos *</Label>
        <p className="text-sm text-muted-foreground">Add high-quality photos to attract more interest</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imageUrls.map((image, index) => (
          <div key={index} className="relative group">
            <img 
              src={image} 
              alt={`Property ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
              onClick={() => removeImage(index)}
            >
              <X className="w-3 h-3" />
            </Button>
            {index === 0 && (
              <Badge className="absolute bottom-2 left-2 text-xs">Main Photo</Badge>
            )}
          </div>
        ))}
        
        {images.length < 10 && (
          <div className="space-y-2">
            {Capacitor.isNativePlatform() ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCameraCapture}
                  className="h-16 flex flex-col gap-1"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">Camera</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGallerySelect}
                  className="h-16 flex flex-col gap-1"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs">Gallery</span>
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  capture="environment"
                />
                <div className="h-32 border-2 border-dashed border-border hover:border-primary rounded-lg flex flex-col items-center justify-center bg-background hover:bg-accent/20 transition-colors">
                  <Camera className="w-6 h-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    📸 Take Photo<br />
                    <span className="text-xs">or choose from gallery</span>
                  </span>
                </div>
              </label>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSampleImage}
              className="w-full text-xs"
            >
              Add Sample Photo
            </Button>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {imageUrls.length}/10 photos uploaded. First photo will be the main listing image.
      </p>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Listing Type *</Label>
          <Select value={formData.listingType} onValueChange={(value) => setFormData(prev => ({ ...prev, listingType: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="for-sale">For Sale</SelectItem>
              <SelectItem value="for-rent">For Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Property Type *</Label>
          <Select value={formData.propertyType} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="office">Office</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Property Title *</Label>
        <Input
          placeholder="e.g., Beautiful Modern Home with City Views"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Address *</Label>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <Input
              placeholder="123 Main Street"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                placeholder="Seattle"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                placeholder="WA"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input
                placeholder="98101"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{isRental ? "Monthly Rent *" : "Price *"}</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRental ? "2,500" : "850,000"}
              value={isRental ? formData.monthlyRent : formData.price}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                [isRental ? 'monthlyRent' : 'price']: e.target.value 
              }))}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Square Feet *</Label>
          <Input
            placeholder="1,200"
            value={formData.squareFeet}
            onChange={(e) => setFormData(prev => ({ ...prev, squareFeet: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          placeholder="Describe your property's best features, location benefits, and what makes it special..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          required
        />
      </div>
    </div>
  );

  const renderPropertyDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Property Details</h3>
      </div>

      {/* Residential Properties */}
      {isResidential && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Bedrooms *</Label>
              <Select value={formData.bedrooms} onValueChange={(value) => setFormData(prev => ({ ...prev, bedrooms: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Beds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5+">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bathrooms *</Label>
              <Select value={formData.bathrooms} onValueChange={(value) => setFormData(prev => ({ ...prev, bathrooms: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Baths" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="1.5">1.5</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="2.5">2.5</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="3.5">3.5</SelectItem>
                  <SelectItem value="4+">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Parking</Label>
              <Select value={formData.parkingSpaces} onValueChange={(value) => setFormData(prev => ({ ...prev, parkingSpaces: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Spaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">1 Space</SelectItem>
                  <SelectItem value="2">2 Spaces</SelectItem>
                  <SelectItem value="3+">3+ Spaces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Year Built</Label>
              <Input
                placeholder="2020"
                value={formData.yearBuilt}
                onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lot Size</Label>
              <Input
                placeholder="0.25 acres or 7,500 sq ft"
                value={formData.lotSize}
                onChange={(e) => setFormData(prev => ({ ...prev, lotSize: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>HOA Fees (Monthly)</Label>
              <Input
                placeholder="350"
                value={formData.hoaFees}
                onChange={(e) => setFormData(prev => ({ ...prev, hoaFees: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Commercial Properties */}
      {isCommercial && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Year Built</Label>
              <Input
                placeholder="2020"
                value={formData.yearBuilt}
                onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Parking Spaces</Label>
              <Input
                placeholder="50"
                value={formData.parkingSpaces}
                onChange={(e) => setFormData(prev => ({ ...prev, parkingSpaces: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Lot Size</Label>
              <Input
                placeholder="2.5 acres"
                value={formData.lotSize}
                onChange={(e) => setFormData(prev => ({ ...prev, lotSize: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Annual Gross Income</Label>
              <Input
                placeholder="120,000"
                value={formData.grossIncome}
                onChange={(e) => setFormData(prev => ({ ...prev, grossIncome: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Annual Expenses</Label>
              <Input
                placeholder="45,000"
                value={formData.expenses}
                onChange={(e) => setFormData(prev => ({ ...prev, expenses: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Land Properties */}
      {formData.propertyType === "land" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lot Size</Label>
              <Input
                placeholder="5 acres or 217,800 sq ft"
                value={formData.lotSize}
                onChange={(e) => setFormData(prev => ({ ...prev, lotSize: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Zoning</Label>
              <Input
                placeholder="Residential, Commercial, Agricultural"
                value={formData.features.join(", ")}
                onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value.split(", ") }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rental-specific fields (for any property type that's for rent) */}
      {isRental && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lease Term</Label>
              <Select value={formData.leaseTerm} onValueChange={(value) => setFormData(prev => ({ ...prev, leaseTerm: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month-to-month">Month to Month</SelectItem>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="12-months">12 Months</SelectItem>
                  <SelectItem value="24-months">24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Security Deposit</Label>
              <Input
                placeholder="2500"
                value={formData.securityDeposit}
                onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Available Date</Label>
            <Input
              type="date"
              value={formData.availableDate}
              onChange={(e) => setFormData(prev => ({ ...prev, availableDate: e.target.value }))}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Features & Amenities</h3>
      </div>

      {/* Residential Features */}
      {isResidential && (
        <>
          <div className="space-y-3">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity) => (
                <Button
                  key={amenity}
                  type="button"
                  variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayField('amenities', amenity)}
                  className="rounded-full"
                >
                  {amenity}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Appliances</Label>
            <div className="flex flex-wrap gap-2">
              {appliancesList.map((appliance) => (
                <Button
                  key={appliance}
                  type="button"
                  variant={formData.appliances.includes(appliance) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayField('appliances', appliance)}
                  className="rounded-full"
                >
                  {appliance}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Interior Features</Label>
            <div className="flex flex-wrap gap-2">
              {featuresList.map((feature) => (
                <Button
                  key={feature}
                  type="button"
                  variant={formData.features.includes(feature) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayField('features', feature)}
                  className="rounded-full"
                >
                  {feature}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Commercial Features */}
      {isCommercial && (
        <>
          <div className="space-y-3">
            <Label>Building Features</Label>
            <div className="flex flex-wrap gap-2">
              {["Elevator", "Loading Dock", "Security System", "HVAC", "High Ceilings", "Open Floor Plan", "Conference Rooms", "Kitchen/Break Room"].map((feature) => (
                <Button
                  key={feature}
                  type="button"
                  variant={formData.features.includes(feature) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayField('features', feature)}
                  className="rounded-full"
                >
                  {feature}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {["Parking", "Reception Area", "Handicap Accessible", "Fiber Internet", "Backup Generator", "Sprinkler System", "24/7 Access", "On-site Management"].map((amenity) => (
                <Button
                  key={amenity}
                  type="button"
                  variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayField('amenities', amenity)}
                  className="rounded-full"
                >
                  {amenity}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Land Features */}
      {formData.propertyType === "land" && (
        <div className="space-y-3">
          <Label>Land Features</Label>
          <div className="flex flex-wrap gap-2">
            {["Utilities Available", "Road Access", "Buildable", "Wooded", "Waterfront", "Agricultural", "Mineral Rights", "Survey Available"].map((feature) => (
              <Button
                key={feature}
                type="button"
                variant={formData.features.includes(feature) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleArrayField('features', feature)}
                className="rounded-full"
              >
                {feature}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="w-12 h-12 text-primary" />
            {subscription.isActive && subscription.tier?.startsWith('seller') && (
              <Crown className="w-6 h-6 text-amber-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">List Your Property</h1>
          <p className="text-muted-foreground">Create a professional listing to attract the right buyers</p>
          
          {!subscription.isActive && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Free Tier Limits</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You can list 1 property for free. Upgrade to a seller plan for unlimited listings and professional tools.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Card className="p-8 shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {renderPhotosSection()}
            
            <Separator />
            
            {renderBasicInfo()}
            
            <Separator />
            
            {renderPropertyDetails()}
            
            <Separator />
            
            {renderFeatures()}
            
            <div className="pt-6">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={!canListProperties(currentPropertyCount) || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    {isEditing ? "Saving..." : "Creating Listing..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {isEditing ? "Save Property" : "List Property"}
                  </>
                )}
              </Button>
              
              {!canListProperties(currentPropertyCount) && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  <Button variant="link" onClick={() => navigate('/subscription')} className="p-0 h-auto text-primary">
                    Upgrade your plan
                  </Button> to list more properties
                </p>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ListProperty;