import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Globe, 
  Phone, 
  MapPin, 
  DollarSign,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Home,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Core Preferences
  userType: string;
  location: string;
  propertyTypes: string[];
  
  // Goals & Bio
  goals: string;
  bio: string;
}

const AuthDialog = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const { toast } = useToast();

  const [formData, setFormData] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: '',
    location: '',
    propertyTypes: [],
    goals: '',
    bio: ''
  });

  const totalSteps = 3;
  const stepProgress = (currentStep / totalSteps) * 100;

  const userTypes = [
    { value: "buyer", label: "🏠 Property Buyer", desc: "Looking to purchase property" },
    { value: "seller", label: "🏡 Property Seller", desc: "Selling my property" },
    { value: "agent", label: "🏢 Real Estate Agent", desc: "Licensed real estate professional" },
    { value: "investor", label: "📈 Property Investor", desc: "Investing in real estate" },
    { value: "developer", label: "🏗️ Developer", desc: "Property development" }
  ];

  const propertyTypes = [
    { name: "Single Family Home", icon: "🏠", popular: true },
    { name: "Condo", icon: "🏢", popular: true },
    { name: "Townhouse", icon: "🏘️", popular: true },
    { name: "Multi-Family", icon: "🏬", popular: false },
    { name: "Commercial", icon: "🏪", popular: false },
    { name: "Land", icon: "🌿", popular: false },
    { name: "Luxury", icon: "💎", popular: true },
    { name: "Investment", icon: "💰", popular: true }
  ];

  const locationSuggestions = [
    "Seattle, WA", "Bellevue, WA", "Redmond, WA", "Tacoma, WA",
    "Portland, OR", "Vancouver, WA", "Spokane, WA", "Olympia, WA",
    "San Francisco, CA", "Los Angeles, CA", "San Diego, CA", "Sacramento, CA",
    "New York, NY", "Brooklyn, NY", "Manhattan, NY", "Queens, NY",
    "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA",
    "San Antonio, TX", "Dallas, TX", "Austin, TX", "Jacksonville, FL",
    "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", "Indianapolis, IN",
    "Denver, CO", "Boston, MA", "Nashville, TN", "Miami, FL"
  ];

  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const filteredLocations = locationSuggestions.filter(location =>
    location.toLowerCase().includes(locationSearch.toLowerCase())
  ).slice(0, 6);

  const handleInputChange = (field: keyof UserProfile, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePropertyTypeToggle = (type: string) => {
    const current = formData.propertyTypes;
    if (current.includes(type)) {
      handleInputChange('propertyTypes', current.filter(t => t !== type));
    } else {
      handleInputChange('propertyTypes', [...current, type]);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Welcome back! 🎉",
      description: "You've been successfully signed in to PropSwipes.",
    });
    setIsOpen(false);
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('User Profile Created:', formData);
    toast({
      title: "Account created! 🚀",
      description: `Welcome to PropSwipes, ${formData.firstName}! Your profile is ready.`,
    });
    setIsOpen(false);
    setCurrentStep(1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.userType;
      case 2:
        return formData.phone && formData.location && formData.propertyTypes.length > 0;
      case 3:
        return formData.goals && formData.bio;
      default:
        return false;
    }
  };

  const renderSignInForm = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Welcome Back</h3>
        <p className="text-muted-foreground">Sign in to continue your property journey</p>
      </div>
      
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </form>
    </div>
  );

  const renderSignUpStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Let's Get Started</h3>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>What best describes you?</Label>
              <div className="grid gap-3">
                {userTypes.map((type) => (
                  <Card 
                    key={type.value}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      formData.userType === type.value 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleInputChange('userType', type.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.desc}</div>
                      </div>
                      {formData.userType === type.value && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Location & Preferences</h3>
              <p className="text-muted-foreground">Where are you looking?</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Where are you looking for properties?</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="location"
                    value={formData.location || locationSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocationSearch(value);
                      handleInputChange('location', value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    placeholder="Search any city, state, or neighborhood..."
                    className="pl-10"
                    required
                  />
                  {showLocationSuggestions && locationSearch && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 max-h-40 overflow-y-auto">
                      {filteredLocations.map((location) => (
                        <div
                          key={location}
                          className="p-2 hover:bg-accent cursor-pointer text-sm"
                          onClick={() => {
                            handleInputChange('location', location);
                            setLocationSearch(location);
                            setShowLocationSuggestions(false);
                          }}
                        >
                          <MapPin className="w-3 h-3 inline mr-2" />
                          {location}
                        </div>
                      ))}
                      {filteredLocations.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          No suggestions found. You can enter any location.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>What properties interest you? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {propertyTypes.map((type) => (
                    <Card
                      key={type.name}
                      className={`p-3 cursor-pointer transition-all hover:shadow-md hover-scale ${
                        formData.propertyTypes.includes(type.name)
                          ? 'ring-2 ring-primary bg-primary/5 scale-105' 
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handlePropertyTypeToggle(type.name)}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-2xl">{type.icon}</div>
                        <div className="text-sm font-medium">{type.name}</div>
                        {type.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Your Property Goals</h3>
              <p className="text-muted-foreground">Help us understand what you're looking for</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goals">Primary Goals</Label>
                <Select value={formData.goals} onValueChange={(value) => handleInputChange('goals', value)}>
                  <SelectTrigger>
                    <Home className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="What's your main goal?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first-home">🏠 First Time Home Buyer</SelectItem>
                    <SelectItem value="upgrade">⬆️ Upgrading Current Home</SelectItem>
                    <SelectItem value="investment">💰 Investment Property</SelectItem>
                    <SelectItem value="downsize">⬇️ Downsizing</SelectItem>
                    <SelectItem value="rental">🏢 Rental Property</SelectItem>
                    <SelectItem value="flip">🔨 Fix & Flip</SelectItem>
                    <SelectItem value="selling">📝 Selling Property</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Tell us more about yourself</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Share your story, timeline, specific needs, or what makes your property search unique..."
                  rows={4}
                  className="resize-none"
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/300 characters
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary/10 to-purple-100/50 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Profile Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <strong>{formData.firstName} {formData.lastName}</strong>
                    <Badge variant="secondary" className="text-xs">
                      {userTypes.find(t => t.value === formData.userType)?.label}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {formData.location}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.propertyTypes.slice(0, 3).map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{type}</Badge>
                    ))}
                    {formData.propertyTypes.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{formData.propertyTypes.length - 3} more</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
                alt="PropSwipes" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-primary">PropSwipes</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="mt-6">
            {renderSignInForm()}
          </TabsContent>
          
          <TabsContent value="signup" className="mt-6">
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <span>{Math.round(stepProgress)}% Complete</span>
                </div>
                <Progress value={stepProgress} className="h-2" />
              </div>
              
              {/* Step Content */}
              {renderSignUpStep()}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStepValid()}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSignUp}
                    disabled={!isStepValid()}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;