import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

const TestSubscription = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription, fetchSubscription } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const subscriptionTiers = [
    { value: "buyer_pro", label: "Buyer Pro", price: 9.99 },
    { value: "seller_basic", label: "Seller Basic", price: 29.99 },
    { value: "seller_professional", label: "Seller Professional", price: 100.00 },
    { value: "seller_enterprise", label: "Seller Enterprise", price: 250.00 }
  ];

  const addTestSubscription = async () => {
    if (!user || !selectedTier) {
      toast({
        title: "Error",
        description: "Please select a subscription tier and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get user profile first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Calculate subscription end date (30 days from now)
      const subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

      const { error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: user.id,
          profile_id: profile.id,
          subscription_tier: selectedTier as any,
          status: 'active' as const,
          subscription_start: new Date().toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
          auto_renew: true
        });

      if (error) throw error;

      await fetchSubscription();
      
      toast({
        title: "Test Subscription Added! 🎉",
        description: `You now have ${selectedTier} access for testing.`,
      });
    } catch (error) {
      console.error('Error adding test subscription:', error);
      toast({
        title: "Error",
        description: "Failed to add test subscription.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchSubscription();
      
      toast({
        title: "Subscription Removed",
        description: "You're back to the free tier.",
      });
    } catch (error) {
      console.error('Error removing subscription:', error);
      toast({
        title: "Error",
        description: "Failed to remove subscription.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDailyLikes = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          daily_likes_used: 0,
          daily_likes_reset_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Daily Likes Reset",
        description: "Your daily like count has been reset to 0.",
      });
    } catch (error) {
      console.error('Error resetting likes:', error);
      toast({
        title: "Error",
        description: "Failed to reset daily likes.",
        variant: "destructive"
      });
    }
  };

  const setDailyLikes = async (count: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_likes_used: count })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Daily Likes Updated",
        description: `Set daily likes used to ${count}.`,
      });
    } catch (error) {
      console.error('Error setting likes:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Testing</h1>
          <p className="text-muted-foreground">Test different subscription states and features</p>
        </div>

        {/* Current Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant={subscription.isActive ? "default" : "secondary"} className="mb-2">
                {subscription.isActive ? "Active" : "Free"}
              </Badge>
              <p className="text-sm text-muted-foreground">Subscription Status</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{subscription.tier || "None"}</p>
              <p className="text-sm text-muted-foreground">Current Tier</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">
                {subscription.subscriptionEnd 
                  ? new Date(subscription.subscriptionEnd).toLocaleDateString()
                  : "N/A"
                }
              </p>
              <p className="text-sm text-muted-foreground">Expires</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{subscription.status}</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </Card>

        {/* Test Subscription Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Subscription</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select Tier to Test</label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose subscription tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionTiers.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label} - ${tier.price}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={addTestSubscription} 
                disabled={!selectedTier || loading}
                className="min-w-[120px]"
              >
                {loading ? "Adding..." : "Add Subscription"}
              </Button>
            </div>
            <Button 
              onClick={removeSubscription} 
              variant="outline" 
              disabled={loading}
            >
              Remove Subscription (Back to Free)
            </Button>
          </div>
        </Card>

        {/* Test Daily Likes */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Daily Likes</h2>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => setDailyLikes(0)} variant="outline" size="sm">
              Set to 0 Likes
            </Button>
            <Button onClick={() => setDailyLikes(5)} variant="outline" size="sm">
              Set to 5 Likes
            </Button>
            <Button onClick={() => setDailyLikes(9)} variant="outline" size="sm">
              Set to 9 Likes
            </Button>
            <Button onClick={() => setDailyLikes(10)} variant="outline" size="sm">
              Set to 10 Likes (Limit)
            </Button>
            <Button onClick={resetDailyLikes} variant="outline" size="sm">
              Reset Daily Likes
            </Button>
          </div>
        </Card>

        {/* Testing Instructions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-medium">1. Test Free Tier Limits:</h3>
              <p className="text-muted-foreground">Set daily likes to 10, then try to like a property in Discover page</p>
            </div>
            <div>
              <h3 className="font-medium">2. Test Buyer Pro Features:</h3>
              <p className="text-muted-foreground">Add Buyer Pro subscription, then check unlimited likes in Discover</p>
            </div>
            <div>
              <h3 className="font-medium">3. Test Seller Features:</h3>
              <p className="text-muted-foreground">Add a seller tier, then check property listing limits and analytics access</p>
            </div>
            <div>
              <h3 className="font-medium">4. Check Profile Page:</h3>
              <p className="text-muted-foreground">Go to Profile → Subscription tab to see live subscription status</p>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Test Links</h2>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => window.open('/discover', '_blank')} variant="outline">
              Test Discover Page
            </Button>
            <Button onClick={() => window.open('/profile', '_blank')} variant="outline">
              Test Profile Page
            </Button>
            <Button onClick={() => window.open('/list-property', '_blank')} variant="outline">
              Test List Property
            </Button>
            <Button onClick={() => window.open('/subscription', '_blank')} variant="outline">
              Test Subscription Page
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestSubscription;