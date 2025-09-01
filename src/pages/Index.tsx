import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Home, Users, MessageCircle, ArrowRight, CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/propswipes-hero.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to discover page
  useEffect(() => {
    if (!loading && user) {
      console.log('🏠 Index: User is authenticated, redirecting to discover');
      navigate('/discover');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Home,
      title: "Professional Property Discovery",
      description: "Browse verified property listings from trusted real estate professionals"
    },
    {
      icon: Shield,
      title: "Secure & Verified",
      description: "All listings are verified and property owners are authenticated"
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Connect securely with property owners and licensed real estate agents"
    },
    {
      icon: Users,
      title: "Trusted Community",
      description: "Join thousands of verified users in our PropSwipes network"
    }
  ];

  const benefits = [
    "Verified property listings only",
    "Professional real estate network",
    "Secure messaging system",
    "Advanced search filters",
    "Mobile-optimized platform",
    "Expert customer support"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Hero Section */}
      <div className="relative overflow-hidden bg-gradient-subtle">
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="mb-12">
            <img 
              src={heroImage} 
              alt="Professional Real Estate Platform"
              className="w-80 h-60 object-cover rounded-xl mx-auto shadow-lg"
            />
          </div>
          
          <h1 className="text-6xl font-bold text-foreground mb-6">
            <span className="text-foreground">Prop</span><span className="text-blue-500">Swipes</span>
          </h1>
          <p className="text-2xl text-muted-foreground mb-4 max-w-4xl mx-auto">
            Connect with verified property owners and licensed real estate professionals
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Discover your next investment opportunity through our secure, professional platform designed for serious real estate buyers and sellers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="xl"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4"
            >
              <Shield className="w-6 h-6 mr-3" />
              Join PropSwipes
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4"
            >
              Sign In to Account
            </Button>
          </div>
        </div>
      </div>

      {/* Professional Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Professional Real Estate Platform
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced tools and verified connections for serious real estate professionals and investors
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-8 text-center border border-border bg-card hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trust & Security Section */}
      <div className="bg-card/50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Trusted by Real Estate Professionals
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our platform maintains the highest standards of security and verification to ensure all users are legitimate real estate professionals, property owners, and serious buyers.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-subtle rounded-xl p-8 text-center">
              <div className="flex justify-center space-x-2 mb-6">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-8 h-8 text-primary fill-primary" />
                ))}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Excellent Customer Satisfaction
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                "Professional platform with excellent verification process and customer support"
              </p>
              <p className="text-foreground font-semibold">
                - Real Estate Professional
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional CTA Section */}
      <div className="bg-background py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Join Our Professional Network?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Connect with verified real estate professionals and discover premium property opportunities
          </p>
          <Button 
            size="xl"
            onClick={() => navigate('/auth')}
            className="text-lg px-10 py-4"
          >
            <Shield className="w-6 h-6 mr-3" />
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
