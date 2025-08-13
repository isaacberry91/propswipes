import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    // Get admin credentials from environment variables
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'isaacberry91@yahoo.com';
    const adminUserPassword = Deno.env.get('ADMIN_USER_PASSWORD') || adminPassword;

    if (!adminPassword) {
      return new Response(
        JSON.stringify({ 
          error: 'Admin password not configured. Please set ADMIN_PASSWORD secret.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify admin password
    const isValid = password === adminPassword;

    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          isValid: false,
          message: 'Invalid password' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        isValid: true,
        adminEmail: adminEmail,
        adminPassword: adminUserPassword,
        message: 'Password verified'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})