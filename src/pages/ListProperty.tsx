import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, MapPin, Home, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ListProperty = () => {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    beds: "",
    baths: "",
    sqft: "",
    location: "",
    description: "",
    propertyType: "",
    tags: [] as string[],
  });
  
  const [images, setImages] = useState<string[]>([]);
  const { toast } = useToast();

  const propertyTags = [
    "Pet-Friendly", "Parking", "Gym", "Pool", "Balcony", "Fireplace",
    "Garden", "Garage", "Waterfront", "Downtown", "Loft", "New Construction"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Property Listed! 🏠",
      description: "Your property is now live and ready for matches!",
    });
    
    // Reset form
    setFormData({
      title: "",
      price: "",
      beds: "",
      baths: "",
      sqft: "",
      location: "",
      description: "",
      propertyType: "",
      tags: [],
    });
    setImages([]);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Home className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">List Your Property</h1>
          <p className="text-muted-foreground">Share your property and find the perfect match</p>
        </div>

        <Card className="p-6 shadow-card border-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Images */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Property Photos</Label>
              <div className="grid grid-cols-2 gap-4">
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

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  placeholder="Modern Downtown Condo"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  placeholder="$850,000"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="beds">Bedrooms</Label>
                <Select value={formData.beds} onValueChange={(value) => setFormData(prev => ({ ...prev, beds: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Beds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5+">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baths">Bathrooms</Label>
                <Select value={formData.baths} onValueChange={(value) => setFormData(prev => ({ ...prev, baths: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Baths" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="1.5">1.5</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="2.5">2.5</SelectItem>
                    <SelectItem value="3+">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sqft">Square Feet</Label>
                <Input
                  id="sqft"
                  placeholder="1,200"
                  value={formData.sqft}
                  onChange={(e) => setFormData(prev => ({ ...prev, sqft: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.propertyType} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="loft">Loft</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Downtown, Seattle"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Beautiful modern condo with city views, updated kitchen, and rooftop access..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label>Property Features</Label>
              <div className="flex flex-wrap gap-2">
                {propertyTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={formData.tags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="rounded-full"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

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