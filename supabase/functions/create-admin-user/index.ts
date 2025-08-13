import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'ankur@furrisic.com';
    const adminUserPassword = Deno.env.get('ADMIN_USER_PASSWORD') || 'FI@1802';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!adminPassword || !serviceRoleKey || !supabaseUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required configuration. Please check secrets.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify admin password first
    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid admin password' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if admin user already exists
    const { data: existingUsers, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminExists = existingUsers.users.some(user => user.email === adminEmail);

    if (adminExists) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Admin user already exists',
          adminEmail: adminEmail
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminUserPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'PropSwipes Admin'
      }
    })

    if (error) {
      console.error('Error creating admin user:', error);
      return new Response(
        JSON.stringify({ error: `Failed to create admin user: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin user created successfully:', data.user?.email);

    // Create admin profile if user was created
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: data.user.id,
          display_name: 'PropSwipes Admin',
          user_type: 'buyer'
        })

      if (profileError) {
        console.error('Error creating admin profile:', profileError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Admin user created successfully',
        adminEmail: adminEmail,
        userId: data.user?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})