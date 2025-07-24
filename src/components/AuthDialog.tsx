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
  profilePhoto: string;
  
  // Professional Info
  userType: string;
  company: string;
  position: string;
  website: string;
  linkedinProfile: string;
  yearsExperience: string;
  
  // Preferences
  location: string;
  budgetRange: string;
  propertyTypes: string[];
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
    profilePhoto: '',
    userType: '',
    company: '',
    position: '',
    website: '',
    linkedinProfile: '',
    yearsExperience: '',
    location: '',
    budgetRange: '',
    propertyTypes: [],
    bio: ''
  });

  const totalSteps = 4;
  const stepProgress = (currentStep / totalSteps) * 100;

  const userTypes = [
    { value: "buyer", label: "🏠 Property Buyer", desc: "Looking to purchase property" },
    { value: "seller", label: "🏡 Property Seller", desc: "Selling my property" },
    { value: "agent", label: "🏢 Real Estate Agent", desc: "Licensed real estate professional" },
    { value: "investor", label: "📈 Property Investor", desc: "Investing in real estate" },
    { value: "developer", label: "🏗️ Developer", desc: "Property development" }
  ];

  const propertyTypes = [
    "Single Family Home", "Condo", "Townhouse", "Multi-Family", 
    "Commercial", "Land", "Luxury", "Investment"
  ];

  const budgetRanges = [
    "Under $300K", "$300K - $500K", "$500K - $750K", "$750K - $1M",
    "$1M - $2M", "$2M - $5M", "$5M+", "No Budget Limit"
  ];

  const experienceYears = [
    "New to Real Estate", "1-2 years", "3-5 years", 
    "6-10 years", "11-15 years", "15+ years"
  ];

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
        return formData.phone && formData.location;
      case 3:
        return true; // Professional info is optional
      case 4:
        return formData.bio;
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
              <h3 className="text-2xl font-bold text-foreground">Contact & Location</h3>
              <p className="text-muted-foreground">How can we reach you?</p>
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
                <Label htmlFor="location">Primary Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Seattle, WA"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              {(formData.userType === 'buyer' || formData.userType === 'investor') && (
                <div className="space-y-2">
                  <Label>Budget Range</Label>
                  <Select value={formData.budgetRange} onValueChange={(value) => handleInputChange('budgetRange', value)}>
                    <SelectTrigger>
                      <DollarSign className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((range) => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-3">
                <Label>Property Types of Interest</Label>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.propertyTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer justify-center py-2"
                      onClick={() => handlePropertyTypeToggle(type)}
                    >
                      {type}
                    </Badge>
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
              <h3 className="text-2xl font-bold text-foreground">Professional Info</h3>
              <p className="text-muted-foreground">Help others connect with you (optional)</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Real Estate Company"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position/Title</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Senior Real Estate Agent"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Select value={formData.yearsExperience} onValueChange={(value) => handleInputChange('yearsExperience', value)}>
                  <SelectTrigger>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    value={formData.linkedinProfile}
                    onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Tell Your Story</h3>
              <p className="text-muted-foreground">Help others understand your property goals</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio & Goals</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about your real estate goals, experience, or what makes you unique in the property market..."
                  rows={6}
                  className="resize-none"
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/500 characters
                </div>
              </div>
              
              <div className="bg-accent/20 p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Profile Preview</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>{formData.firstName} {formData.lastName}</strong></div>
                  <div className="text-muted-foreground">{formData.position} at {formData.company}</div>
                  <div className="text-muted-foreground">{formData.location}</div>
                  <Badge variant="secondary">{userTypes.find(t => t.value === formData.userType)?.label}</Badge>
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