import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Home, Plus, Building, Warehouse, Store, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ListProperty = () => {
  const [formData, setFormData] = useState({
    // General Fields
    listingType: "",
    propertyType: "",
    address: "",
    city: "",
    state: "",
    squareFeet: "",
    yearBuilt: "",
    lotSize: "",
    annualTaxes: "",
    keyFeatures: "",
    
    // Basic Details
    title: "",
    price: "",
    description: "",
    
    // Residential Fields
    bedrooms: "",
    bathrooms: "",
    parkingSpaces: "",
    hoaFees: "",
    amenities: [] as string[],
    interiorFeatures: [] as string[],
    exteriorFeatures: [] as string[],
    
    // Commercial Industrial
    propertySubtype: "",
    clearHeight: "",
    dockDoors: "",
    powerSupply: "",
    zoningType: "",
    loadingType: "",
    ceilingHeight: "",
    sprinklerSystem: "",
    columnSpacing: "",
    buildingClass: "",
    lotCoverage: "",
    
    // Commercial Retail
    frontage: "",
    parkingRatio: "",
    signageAvailability: "",
    footTraffic: "",
    visibility: "",
    
    // Commercial Office
    officeClass: "",
    layout: "",
    floor: "",
    elevatorAccess: "",
    conferenceRooms: "",
    itInfrastructure: "",
    security: "",
    
    // Multi-Family
    totalUnits: "",
    unitMix: "",
    occupancyRate: "",
    capRate: "",
    grossRentMultiplier: "",
    laundryFacilities: "",
    commonAreas: "",
    
    // Rentals
    monthlyRent: "",
    leaseTerm: "",
    securityDeposit: "",
    utilitiesIncluded: "",
    availableDate: "",
    petPolicy: "",
    furnished: "",
  });
  
  const [images, setImages] = useState<string[]>([]);
  const { toast } = useToast();

  const amenitiesList = [
    "Pool", "Gym", "Doorman", "Balcony", "In-unit Laundry", "Elevator",
    "Parking", "Garden", "Rooftop Access", "Concierge", "Storage", "Pet-Friendly"
  ];

  const interiorFeaturesList = [
    "Hardwood Floors", "Central AC/Heat", "Fireplace", "Stainless Steel Appliances",
    "Granite Countertops", "Walk-in Closet", "High Ceilings", "Crown Molding"
  ];

  const exteriorFeaturesList = [
    "Patio", "Yard", "Garage", "Fenced", "Deck", "Balcony", "Garden", "Driveway"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Property Listed! 🏠",
      description: "Your property is now live with all details!",
    });
    
    // Reset form
    setFormData({
      listingType: "",
      propertyType: "",
      address: "",
      city: "",
      state: "",
      squareFeet: "",
      yearBuilt: "",
      lotSize: "",
      annualTaxes: "",
      keyFeatures: "",
      title: "",
      price: "",
      description: "",
      bedrooms: "",
      bathrooms: "",
      parkingSpaces: "",
      hoaFees: "",
      amenities: [],
      interiorFeatures: [],
      exteriorFeatures: [],
      propertySubtype: "",
      clearHeight: "",
      dockDoors: "",
      powerSupply: "",
      zoningType: "",
      loadingType: "",
      ceilingHeight: "",
      sprinklerSystem: "",
      columnSpacing: "",
      buildingClass: "",
      lotCoverage: "",
      frontage: "",
      parkingRatio: "",
      signageAvailability: "",
      footTraffic: "",
      visibility: "",
      officeClass: "",
      layout: "",
      floor: "",
      elevatorAccess: "",
      conferenceRooms: "",
      itInfrastructure: "",
      security: "",
      totalUnits: "",
      unitMix: "",
      occupancyRate: "",
      capRate: "",
      grossRentMultiplier: "",
      laundryFacilities: "",
      commonAreas: "",
      monthlyRent: "",
      leaseTerm: "",
      securityDeposit: "",
      utilitiesIncluded: "",
      availableDate: "",
      petPolicy: "",
      furnished: "",
    });
    setImages([]);
  };

  const toggleArrayField = (field: string, item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).includes(item) 
        ? (prev[field as keyof typeof prev] as string[]).filter(i => i !== item)
        : [...(prev[field as keyof typeof prev] as string[]), item]
    }));
  };

  const addSampleImage = () => {
    const sampleImages = [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setImages(prev => [...prev, randomImage]);
  };

  const renderGeneralFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Listing Type</Label>
          <Select value={formData.listingType} onValueChange={(value) => setFormData(prev => ({ ...prev, listingType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="For Sale / For Lease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="for-sale">For Sale</SelectItem>
              <SelectItem value="for-lease">For Lease</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Property Type</Label>
          <Select value={formData.propertyType} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="mixed-use">Mixed-Use</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Property Address</Label>
        <Input
          placeholder="123 Main Street"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            placeholder="Seattle"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input
            placeholder="WA"
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Square Feet</Label>
          <Input
            placeholder="1,200"
            value={formData.squareFeet}
            onChange={(e) => setFormData(prev => ({ ...prev, squareFeet: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Year Built</Label>
          <Input
            placeholder="2020"
            value={formData.yearBuilt}
            onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Lot Size</Label>
          <Input
            placeholder="0.25 acres"
            value={formData.lotSize}
            onChange={(e) => setFormData(prev => ({ ...prev, lotSize: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Annual Taxes</Label>
          <Input
            placeholder="$12,000"
            value={formData.annualTaxes}
            onChange={(e) => setFormData(prev => ({ ...prev, annualTaxes: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Property Title</Label>
          <Input
            placeholder="Modern Downtown Condo"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Price</Label>
          <Input
            placeholder="$850,000"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Key Features</Label>
        <Textarea
          placeholder="Updated kitchen, natural light, corner unit..."
          value={formData.keyFeatures}
          onChange={(e) => setFormData(prev => ({ ...prev, keyFeatures: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Beautiful modern property with..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          required
        />
      </div>
    </div>
  );

  const renderResidentialFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Bedrooms</Label>
          <Input
            placeholder="3"
            value={formData.bedrooms}
            onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Bathrooms</Label>
          <Input
            placeholder="2.5"
            value={formData.bathrooms}
            onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Parking Spaces</Label>
          <Input
            placeholder="2"
            value={formData.parkingSpaces}
            onChange={(e) => setFormData(prev => ({ ...prev, parkingSpaces: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>HOA Fees (Monthly)</Label>
          <Input
            placeholder="$350"
            value={formData.hoaFees}
            onChange={(e) => setFormData(prev => ({ ...prev, hoaFees: e.target.value }))}
          />
        </div>
      </div>

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
        <Label>Interior Features</Label>
        <div className="flex flex-wrap gap-2">
          {interiorFeaturesList.map((feature) => (
            <Button
              key={feature}
              type="button"
              variant={formData.interiorFeatures.includes(feature) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleArrayField('interiorFeatures', feature)}
              className="rounded-full"
            >
              {feature}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Exterior Features</Label>
        <div className="flex flex-wrap gap-2">
          {exteriorFeaturesList.map((feature) => (
            <Button
              key={feature}
              type="button"
              variant={formData.exteriorFeatures.includes(feature) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleArrayField('exteriorFeatures', feature)}
              className="rounded-full"
            >
              {feature}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCommercialIndustrialFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Property Subtype</Label>
          <Select value={formData.propertySubtype} onValueChange={(value) => setFormData(prev => ({ ...prev, propertySubtype: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Subtype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="flex-space">Flex Space</SelectItem>
              <SelectItem value="distribution">Distribution</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Clear Height (feet)</Label>
          <Input
            placeholder="24"
            value={formData.clearHeight}
            onChange={(e) => setFormData(prev => ({ ...prev, clearHeight: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Dock High Doors</Label>
          <Input
            placeholder="4"
            value={formData.dockDoors}
            onChange={(e) => setFormData(prev => ({ ...prev, dockDoors: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Power Supply</Label>
          <Input
            placeholder="3 Phase, 480V"
            value={formData.powerSupply}
            onChange={(e) => setFormData(prev => ({ ...prev, powerSupply: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Zoning Type</Label>
          <Input
            placeholder="M1, I-2"
            value={formData.zoningType}
            onChange={(e) => setFormData(prev => ({ ...prev, zoningType: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  const renderCommercialRetailFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Frontage (ft)</Label>
          <Input
            placeholder="150"
            value={formData.frontage}
            onChange={(e) => setFormData(prev => ({ ...prev, frontage: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Parking Ratio</Label>
          <Input
            placeholder="4 per 1,000 sq ft"
            value={formData.parkingRatio}
            onChange={(e) => setFormData(prev => ({ ...prev, parkingRatio: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Signage Available</Label>
          <Select value={formData.signageAvailability} onValueChange={(value) => setFormData(prev => ({ ...prev, signageAvailability: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Yes/No" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="street-level">Street-Level</SelectItem>
              <SelectItem value="highway">Highway</SelectItem>
              <SelectItem value="corner-lot">Corner Lot</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Foot Traffic Data</Label>
          <Input
            placeholder="High, Medium, Low"
            value={formData.footTraffic}
            onChange={(e) => setFormData(prev => ({ ...prev, footTraffic: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  const renderRentalFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Monthly Rent</Label>
          <Input
            placeholder="$2,500"
            value={formData.monthlyRent}
            onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Lease Term</Label>
          <Input
            placeholder="12 months"
            value={formData.leaseTerm}
            onChange={(e) => setFormData(prev => ({ ...prev, leaseTerm: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Security Deposit</Label>
          <Input
            placeholder="$2,500"
            value={formData.securityDeposit}
            onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Available Date</Label>
          <Input
            type="date"
            value={formData.availableDate}
            onChange={(e) => setFormData(prev => ({ ...prev, availableDate: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Pet Policy</Label>
          <Select value={formData.petPolicy} onValueChange={(value) => setFormData(prev => ({ ...prev, petPolicy: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Pets Allowed</SelectItem>
              <SelectItem value="no">No Pets</SelectItem>
              <SelectItem value="restrictions">With Restrictions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Home className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">List Your Property</h1>
          <p className="text-muted-foreground">Complete property listing with all details</p>
        </div>

        <Card className="p-6 shadow-card border-0 bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Images */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Property Photos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={image} 
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="floating"
                  className="h-32 border-2 border-dashed border-border hover:border-primary"
                  onClick={addSampleImage}
                >
                  <div className="text-center">
                    <Camera className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                  </div>
                </Button>
              </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">
                  <Home className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="residential">
                  <Building className="w-4 h-4 mr-2" />
                  Residential
                </TabsTrigger>
                <TabsTrigger value="commercial">
                  <Warehouse className="w-4 h-4 mr-2" />
                  Industrial
                </TabsTrigger>
                <TabsTrigger value="retail">
                  <Store className="w-4 h-4 mr-2" />
                  Retail
                </TabsTrigger>
                <TabsTrigger value="rental">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Rental
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                {renderGeneralFields()}
              </TabsContent>

              <TabsContent value="residential">
                {renderResidentialFields()}
              </TabsContent>

              <TabsContent value="commercial">
                {renderCommercialIndustrialFields()}
              </TabsContent>

              <TabsContent value="retail">
                {renderCommercialRetailFields()}
              </TabsContent>

              <TabsContent value="rental">
                {renderRentalFields()}
              </TabsContent>
            </Tabs>

            <Button type="submit" variant="gradient" size="lg" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              List Property
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ListProperty;