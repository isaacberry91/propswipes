import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Home, Users, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Home,
      title: "Discover Properties",
      description: "Swipe through beautiful properties tailored to your preferences"
    },
    {
      icon: Heart,
      title: "Smart Matching",
      description: "Get matched with people interested in the same properties"
    },
    {
      icon: MessageCircle,
      title: "Direct Chat",
      description: "Connect instantly with potential buyers, sellers, or co-investors"
    },
    {
      icon: Users,
      title: "Community",
      description: "Join a community of property enthusiasts and investors"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="mb-8">
            <img 
              src={heroImage} 
              alt="Propswipes Hero"
              className="w-64 h-48 object-cover rounded-2xl mx-auto shadow-card animate-float"
            />
          </div>
          
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Prop<span className="text-primary">swipes</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Tinder for Real Estate
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Swipe through properties, match with like-minded buyers, and find your perfect real estate opportunity together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="gradient" 
              size="xl"
              onClick={() => navigate('/auth')}
              className="text-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => navigate('/auth')}
              className="text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How Propswipes Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Find your perfect property match in three simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 text-center shadow-card border-0 hover:shadow-xl transition-all duration-300 hover:animate-float">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Find Your Property Match?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users already discovering their perfect properties
          </p>
          <Button 
            variant="gradient" 
            size="xl"
            onClick={() => navigate('/auth')}
            className="text-lg"
          >
            <Heart className="w-5 h-5 mr-2" />
            Start Matching Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
