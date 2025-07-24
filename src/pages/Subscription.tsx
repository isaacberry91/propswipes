import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Building, Crown, Users } from "lucide-react";

const Subscription = () => {
  const buyerPlans = [
    {
      id: "buyer_pro",
      name: "Buyer Pro",
      price: 9.99,
      badge: "Popular",
      badgeColor: "bg-primary",
      icon: Star,
      iconColor: "bg-blue-500",
      description: "Perfect for serious property buyers",
      features: [
        "Unlimited daily likes",
        "Saved properties list",
        "Advanced search filters",
        "Property comparison tools",
        "Market insights access",
        "Priority customer support",
        "Property history tracking",
        "Investment analysis tools"
      ]
    }
  ];

  const sellerPlans = [
    {
      id: "seller_basic",
      name: "Seller Basic",
      price: 29.99,
      badge: "Value",
      badgeColor: "bg-emerald-500",
      icon: Users,
      iconColor: "bg-emerald-500",
      description: "Essential tools for property sellers",
      features: [
        "5 property listings",
        "Unlimited daily likes",
        "Analytics dashboard",
        "Lead management system",
        "Market comparison tools",
        "Enhanced listing visibility",
        "Buyer notification system",
        "Professional property cards"
      ]
    },
    {
      id: "seller_professional",
      name: "Seller Professional",
      price: 100.00,
      badge: "Pro",
      badgeColor: "bg-purple-500",
      icon: Building,
      iconColor: "bg-purple-500",
      description: "Advanced features for real estate professionals",
      features: [
        "25 property listings",
        "Unlimited daily likes",
        "Advanced analytics dashboard",
        "Team management tools",
        "Priority listing features",
        "Enhanced lead management",
        "Performance tracking",
        "24/7 phone support available"
      ]
    },
    {
      id: "seller_enterprise",
      name: "Seller Enterprise",
      price: 250.00,
      badge: "Enterprise",
      badgeColor: "bg-amber-500",
      icon: Crown,
      iconColor: "bg-amber-500",
      description: "For large real estate firms and agencies",
      features: [
        "Unlimited property listings",
        "Unlimited daily likes",
        "All premium features included",
        "Advanced team management suite",
        "Comprehensive analytics dashboard",
        "All buyer & seller features",
        "Professional collaboration tools",
        "Priority 24/7 phone support"
      ]
    }
  ];

  const handleSubscribe = (planId: string) => {
    // TODO: Implement subscription logic
    console.log(`Subscribing to plan: ${planId}`);
  };

  const PlanCard = ({ plan, type }: { plan: any, type: 'buyer' | 'seller' }) => {
    const Icon = plan.icon;
    
    return (
      <Card className="p-6 relative overflow-hidden">
        {plan.badge && (
          <Badge 
            className={`absolute top-4 right-4 text-white ${plan.badgeColor}`}
          >
            {plan.badge}
          </Badge>
        )}
        
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl ${plan.iconColor} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
            <p className="text-muted-foreground text-sm">{plan.description}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">${plan.price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {plan.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <Button 
          onClick={() => handleSubscribe(plan.id)}
          className={`w-full ${
            plan.badge === "Popular" ? "bg-blue-500 hover:bg-blue-600" :
            plan.badge === "Value" ? "bg-emerald-500 hover:bg-emerald-600" :
            plan.badge === "Pro" ? "bg-purple-500 hover:bg-purple-600" :
            "bg-amber-500 hover:bg-amber-600"
          } text-white`}
        >
          Subscribe Now
        </Button>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of PropSwipes with our subscription plans
          </p>
        </div>

        {/* Buyer Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">For Buyers</h2>
          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            {buyerPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} type="buyer" />
            ))}
          </div>
        </div>

        {/* Seller Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">For Sellers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {sellerPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} type="seller" />
            ))}
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center">
          <p className="text-muted-foreground">
            All subscriptions include 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;