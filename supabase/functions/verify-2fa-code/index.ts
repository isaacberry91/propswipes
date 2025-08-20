import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid user');
    }

    const { code, setup = false } = await req.json();

    // Find the OTP code
    const { data: otpData, error: findError } = await supabaseClient
      .from('two_factor_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !otpData) {
      throw new Error('Invalid or expired verification code');
    }

    // Mark code as used
    const { error: updateError } = await supabaseClient
      .from('two_factor_codes')
      .update({ used: true })
      .eq('id', otpData.id);

    if (updateError) {
      throw updateError;
    }

    if (setup) {
      // Enable 2FA for the user
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ 
          two_factor_enabled: true,
          two_factor_method: otpData.type,
          two_factor_contact: otpData.contact
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: setup ? '2FA has been enabled successfully' : 'Code verified successfully',
        type: otpData.type,
        contact: otpData.contact
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-2fa-code:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to verify code' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});