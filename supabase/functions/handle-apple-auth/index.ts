import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user, isFirstLogin } = await req.json()
    
    console.log('Apple Auth Handler:', { userId: user.id, isFirstLogin, userMetadata: user.user_metadata })

    if (isFirstLogin && user.user_metadata?.provider === 'apple') {
      // This is a first-time Apple login - store the data
      const appleId = user.user_metadata.sub // Apple's subject identifier
      const email = user.email
      const name = user.user_metadata.full_name || user.user_metadata.name
      
      console.log('Storing Apple ID mapping:', { appleId, email, name })

      // Store the Apple ID mapping
      const { error: mappingError } = await supabaseAdmin
        .from('apple_id_mappings')
        .insert({
          apple_id: appleId,
          email: email,
          display_name: name,
          user_id: user.id
        })

      if (mappingError) {
        console.error('Error storing Apple ID mapping:', mappingError)
        throw mappingError
      }

      // Update the profile with the provided information
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          display_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        throw profileError
      }

    } else if (user.user_metadata?.provider === 'apple') {
      // This is a subsequent Apple login - look up the stored data
      const appleId = user.user_metadata.sub
      
      console.log('Looking up Apple ID mapping for:', appleId)

      const { data: mapping, error: lookupError } = await supabaseAdmin
        .from('apple_id_mappings')
        .select('*')
        .eq('apple_id', appleId)
        .single()

      if (lookupError) {
        console.error('Error looking up Apple ID mapping:', lookupError)
        throw lookupError
      }

      if (mapping) {
        console.log('Found Apple ID mapping:', mapping)
        
        // Update the profile with the stored information
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            display_name: mapping.display_name,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (profileError) {
          console.error('Error updating profile from mapping:', profileError)
          throw profileError
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Apple auth handler error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})