import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id, email: user.email });

    const { transactionId, receiptData, productId } = await req.json();
    if (!transactionId || !receiptData || !productId) {
      throw new Error('Missing required purchase data');
    }

    logStep('Purchase data received', { transactionId, productId });

    // Get user's profile
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error('User profile not found');
    }

    // Map product ID to subscription tier - updated for new PropSwipes main app
    const tierMap: Record<string, string> = {
      'com.propswipes.main.buyer.pro.monthly': 'buyer_pro',
      'com.propswipes.main.seller.basic.monthly': 'seller_basic',
      'com.propswipes.main.seller.professional.monthly': 'seller_professional',
      'com.propswipes.main.seller.enterprise.monthly': 'seller_enterprise',
      // Legacy support for old product IDs to prevent conflicts
      'com.propswipes.subscription.buyer_pro': 'buyer_pro',
      'com.propswipes.seller_basic': 'seller_basic',
      'com.propswipes.seller_professional': 'seller_professional',
      'com.propswipes.seller_enterprise': 'seller_enterprise'
    };

    const subscriptionTier = tierMap[productId];
    if (!subscriptionTier) {
      throw new Error(`Unknown product ID: ${productId}`);
    }

    // Create/update subscription record
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // 1 month from now

    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: user.id,
        profile_id: profileData.id,
        subscription_tier: subscriptionTier,
        status: 'active',
        apple_transaction_id: transactionId,
        apple_receipt_data: receiptData,
        subscription_start: new Date().toISOString(),
        subscription_end: subscriptionEnd.toISOString(),
        auto_renew: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,subscription_tier'
      })
      .select()
      .single();

    if (subscriptionError) {
      logStep('Database error', subscriptionError);
      throw new Error(`Database error: ${subscriptionError.message}`);
    }

    logStep('Subscription created/updated', { 
      tier: subscriptionTier, 
      end: subscriptionEnd.toISOString() 
    });

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        tier: subscriptionTier,
        status: 'active',
        subscriptionEnd: subscriptionEnd.toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});