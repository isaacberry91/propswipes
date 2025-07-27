import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionPromptProps {
  feature: "likes" | "listings" | "filters" | "analytics";
  title?: string;
  description?: string;
  variant?: "card" | "banner" | "modal";
  onDismiss?: () => void;
}

const SubscriptionPrompt = ({ 
  feature, 
  title, 
  description, 
  variant = "card",
  onDismiss 
}: SubscriptionPromptProps) => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  const getFeatureDetails = () => {
    switch (feature) {
      case "likes":
        return {
          title: title || "Daily Like Limit Reached! 💝",
          description: description || "Upgrade to Buyer Pro for unlimited daily likes and find your perfect property faster.",
          icon: <Star className="w-5 h-5" />,
          suggestedPlan: "Buyer Pro",
          color: "text-pink-600"
        };
      case "listings":
        return {
          title: title || "Property Listing Limit Reached! 🏠",
          description: description || "Upgrade to a seller plan to list more properties and access professional tools.",
          icon: <Crown className="w-5 h-5" />,
          suggestedPlan: subscription.tier?.startsWith('seller') ? "Higher Seller Tier" : "Seller Basic",
          color: "text-blue-600"
        };
      case "filters":
        return {
          title: title || "Advanced Filters Available! 🔍",
          description: description || "Upgrade to unlock advanced search filters and find exactly what you're looking for.",
          icon: <Zap className="w-5 h-5" />,
          suggestedPlan: "Buyer Pro",
          color: "text-purple-600"
        };
      case "analytics":
        return {
          title: title || "Analytics Dashboard Available! 📊",
          description: description || "Upgrade to a seller plan to access detailed analytics and insights for your listings.",
          icon: <TrendingUp className="w-5 h-5" />,
          suggestedPlan: "Seller Basic",
          color: "text-green-600"
        };
      default:
        return {
          title: "Upgrade Available!",
          description: "Unlock premium features with a subscription.",
          icon: <Crown className="w-5 h-5" />,
          suggestedPlan: "Pro",
          color: "text-primary"
        };
    }
  };

  const details = getFeatureDetails();

  const handleUpgrade = () => {
    navigate('/subscription');
    onDismiss?.();
  };

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${details.color} bg-white rounded-full p-2`}>
              {details.icon}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{details.title}</h4>
              <p className="text-sm text-muted-foreground">{details.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{details.suggestedPlan}</Badge>
            <Button onClick={handleUpgrade} size="sm">
              Upgrade
            </Button>
            {onDismiss && (
              <Button onClick={onDismiss} variant="ghost" size="sm">
                ×
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-background to-accent/10">
      <div className="flex items-start gap-4">
        <div className={`${details.color} bg-white rounded-full p-3 shadow-sm`}>
          {details.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{details.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {details.suggestedPlan}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-4">
            {details.description}
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={handleUpgrade} className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              View Plans
            </Button>
            {onDismiss && (
              <Button onClick={onDismiss} variant="outline" size="sm">
                Maybe Later
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SubscriptionPrompt;