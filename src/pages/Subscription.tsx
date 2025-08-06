import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Building, Crown, Users, Smartphone, AlertCircle, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { iapService, PRODUCT_IDS } from "@/services/iapService";
import { useSubscription } from "@/hooks/useSubscription";

const Subscription = () => {
  const [isNative, setIsNative] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { subscription, fetchSubscription } = useSubscription();

  useEffect(() => {
    const initializeIAP = async () => {
      setIsNative(Capacitor.isNativePlatform());
      
      if (Capacitor.isNativePlatform()) {
        try {
          await iapService.initialize();
        } catch (error) {
          console.error('Failed to initialize IAP:', error);
        }
      }
      
      setIsReady(true);
    };
    
    initializeIAP();
  }, []);
  const buyerPlans = [
    {
      id: PRODUCT_IDS.BUYER_PRO,
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
      id: PRODUCT_IDS.SELLER_BASIC,
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
      id: PRODUCT_IDS.SELLER_PROFESSIONAL,
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
      id: PRODUCT_IDS.SELLER_ENTERPRISE,
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

  const handleSubscribe = async (planId: string) => {
    if (!isNative) {
      alert("Subscriptions are only available in the mobile app. Please download the app from the App Store or Google Play.");
      return;
    }

    try {
      console.log(`Starting native IAP for plan: ${planId}`);
      const purchase = await iapService.purchaseProduct(planId);
      console.log('Purchase successful:', purchase);
      
      // Refresh subscription status
      await fetchSubscription();
      
      alert("Purchase successful! Your subscription is now active.");
    } catch (error) {
      console.error("IAP Error:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Unable to process purchase. Please try again.");
      }
    }
  };

  const handleRestorePurchases = async () => {
    if (!isNative) {
      alert("Restore purchases is only available in the mobile app.");
      return;
    }

    try {
      console.log('Starting restore purchases...');
      const restoredPurchases = await iapService.restorePurchases();
      
      if (restoredPurchases.length > 0) {
        // Refresh subscription status
        await fetchSubscription();
        alert(`Successfully restored ${restoredPurchases.length} purchase(s).`);
      } else {
        alert("No previous purchases found to restore.");
      }
    } catch (error) {
      console.error("Restore Error:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Unable to restore purchases. Please try again.");
      }
    }
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

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of PropSwipes with our subscription plans
          </p>
        </div>

        {/* Platform Notice */}
        {!isNative && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Mobile App Required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Subscriptions are only available in our mobile app. Download from the App Store or Google Play to subscribe.
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Restore Purchases Button */}
        {isNative && (
          <div className="text-center mb-8">
            <Button
              variant="outline"
              onClick={handleRestorePurchases}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restore Purchases
            </Button>
          </div>
        )}

        {/* Money Back Guarantee */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            All subscriptions include 30-day money-back guarantee
          </p>
          
          {/* Legal Links */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <a 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Terms of Use
            </a>
            <span className="text-muted-foreground">•</span>
            <a 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;