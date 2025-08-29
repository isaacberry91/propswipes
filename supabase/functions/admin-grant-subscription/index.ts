import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-GRANT-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Verify admin authentication
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Check if user is admin
    const adminEmails = ['admin@propswipes.com', 'support@propswipes.com', 'isaacberry91@yahoo.com', 'ankur@furrisic.com', 'developer@furrisic.com'];
    if (!adminEmails.includes(user.email)) {
      throw new Error("Unauthorized: Admin access required");
    }

    logStep("Admin authenticated", { email: user.email });

    const { userId, subscriptionTier, duration } = await req.json();
    
    if (!userId || !subscriptionTier) {
      throw new Error("Missing required fields: userId and subscriptionTier");
    }

    logStep("Request data", { userId, subscriptionTier, duration });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, user_id, display_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Calculate subscription end date
    let subscriptionEnd;
    if (duration === 'lifetime') {
      // Set to 50 years from now for lifetime
      subscriptionEnd = new Date();
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 50);
    } else {
      // Default to 1 year
      subscriptionEnd = new Date();
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + (duration || 1));
    }

    logStep("Calculated subscription end", { subscriptionEnd });

    // Upsert subscription
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: userId,
        profile_id: profile.id,
        subscription_tier: subscriptionTier,
        status: 'active',
        subscription_start: new Date().toISOString(),
        subscription_end: subscriptionEnd.toISOString(),
        auto_renew: false,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      })
      .select()
      .single();

    if (subscriptionError) {
      logStep("Subscription error", subscriptionError);
      throw new Error(`Failed to grant subscription: ${subscriptionError.message}`);
    }

    logStep("Subscription granted successfully", { subscription });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully granted ${subscriptionTier} subscription to ${profile.display_name || 'user'}`,
      subscription
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});