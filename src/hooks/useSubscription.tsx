import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionData {
  tier: string | null;
  status: string;
  subscriptionEnd: string | null;
  isActive: boolean;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: null,
    status: 'free',
    subscriptionEnd: null,
    isActive: false
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription({
        tier: null,
        status: 'free',
        subscriptionEnd: null,
        isActive: false
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('subscription_end', new Date().toISOString())
        .order('subscription_tier', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription({
          tier: null,
          status: 'free',
          subscriptionEnd: null,
          isActive: false
        });
        return;
      }

      if (data && data.length > 0) {
        const sub = data[0];
        setSubscription({
          tier: sub.subscription_tier,
          status: sub.status,
          subscriptionEnd: sub.subscription_end,
          isActive: true
        });
      } else {
        setSubscription({
          tier: null,
          status: 'free',
          subscriptionEnd: null,
          isActive: false
        });
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
      setSubscription({
        tier: null,
        status: 'free',
        subscriptionEnd: null,
        isActive: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Feature access helpers
  const hasUnlimitedLikes = () => {
    return subscription.isActive; // All paid plans have unlimited likes
  };

  const canListProperties = (currentCount: number) => {
    if (!subscription.isActive) return currentCount < 1; // Free: 1 property
    
    switch (subscription.tier) {
      case 'seller_basic':
        return currentCount < 5;
      case 'seller_professional':
        return currentCount < 25;
      case 'seller_enterprise':
        return true; // Unlimited
      default:
        return currentCount < 1;
    }
  };

  const hasAdvancedFilters = () => {
    return subscription.tier === 'buyer_pro' || 
           subscription.tier?.startsWith('seller');
  };

  const hasAnalytics = () => {
    return subscription.tier?.startsWith('seller');
  };

  const hasTeamManagement = () => {
    return subscription.tier === 'seller_professional' || 
           subscription.tier === 'seller_enterprise';
  };

  const hasPrioritySupport = () => {
    return subscription.isActive;
  };

  return {
    subscription,
    loading,
    fetchSubscription,
    // Feature access
    hasUnlimitedLikes,
    canListProperties,
    hasAdvancedFilters,
    hasAnalytics,
    hasTeamManagement,
    hasPrioritySupport
  };
};