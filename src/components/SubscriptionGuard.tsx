import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionPrompt from "./SubscriptionPrompt";

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: "likes" | "listings" | "filters" | "analytics";
  fallback?: ReactNode;
  showPrompt?: boolean;
}

const SubscriptionGuard = ({ 
  children, 
  feature, 
  fallback,
  showPrompt = true 
}: SubscriptionGuardProps) => {
  const { 
    hasUnlimitedLikes, 
    canListProperties, 
    hasAdvancedFilters, 
    hasAnalytics,
    subscription 
  } = useSubscription();

  const hasAccess = () => {
    switch (feature) {
      case "likes":
        return hasUnlimitedLikes();
      case "listings":
        // This would need actual property count from props or context
        return canListProperties(0); 
      case "filters":
        return hasAdvancedFilters();
      case "analytics":
        return hasAnalytics();
      default:
        return false;
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showPrompt) {
    return <SubscriptionPrompt feature={feature} variant="card" />;
  }

  return null;
};

export default SubscriptionGuard;