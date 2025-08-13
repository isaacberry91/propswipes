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
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create admin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@propswipes.com',
      password: 'admin123password',
      email_confirm: true,
      user_metadata: {
        display_name: 'PropSwipes Admin'
      }
    })

    if (error && !error.message.includes('already been registered')) {
      console.error('Error creating admin user:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create admin profile if user was created
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
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
        message: 'Admin user created or already exists',
        user: data.user 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

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