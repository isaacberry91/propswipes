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
    
    console.log('Apple Auth Handler:', { userId: user.id, isFirstLogin, userMetadata: user.user_metadata, appMetadata: user.app_metadata })

    // Check if this is an Apple user
    const isAppleUser = user.app_metadata?.provider === 'apple' || user.user_metadata?.provider === 'apple'
    
    if (isAppleUser) {
      // Determine if this is first login by checking if we have email and full user data
      const hasFullUserData = user.email && (user.user_metadata?.full_name || user.user_metadata?.name)
      const appleId = user.user_metadata?.sub || user.app_metadata?.provider_id // Apple's subject identifier
      const email = user.email
      const name = user.user_metadata?.full_name || user.user_metadata?.name
      
      console.log('Apple user detected:', { appleId, email, name, hasFullUserData, isFirstLogin })

      if (hasFullUserData && isFirstLogin) {
        // This is a first-time Apple login with full data - store the mapping
        console.log('Storing Apple ID mapping for first login:', { appleId, email, name })
        
        const { error: mappingError } = await supabaseAdmin
          .from('apple_id_mappings')
          .upsert({
            apple_id: appleId,
            email: email,
            display_name: name,
            user_id: user.id
          }, { 
            onConflict: 'apple_id' 
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
      } else {
        // This is a subsequent Apple login or first login without full data - look up stored data
        console.log('Looking up Apple ID mapping for subsequent login:', appleId)

        const { data: mapping, error: lookupError } = await supabaseAdmin
          .from('apple_id_mappings')
          .select('*')
          .eq('apple_id', appleId)
          .maybeSingle()

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
        } else {
          console.log('No Apple ID mapping found for:', appleId)
          // If we have any user data available, store it
          if (appleId && (email || name)) {
            console.log('Creating new mapping with available data')
            const { error: mappingError } = await supabaseAdmin
              .from('apple_id_mappings')
              .insert({
                apple_id: appleId,
                email: email,
                display_name: name,
                user_id: user.id
              })

            if (mappingError) {
              console.error('Error creating Apple ID mapping:', mappingError)
            }
          }
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