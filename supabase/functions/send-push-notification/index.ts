import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientUserId, notification } = await req.json()
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the recipient's push tokens
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('user_push_tokens')
      .select('push_token, platform')
      .eq('user_id', recipientUserId)

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user:', recipientUserId)
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send notifications to all user's devices
    const results = []
    for (const token of tokens) {
      try {
        // For now, just log the notification - you'll need to implement actual push service
        console.log(`Sending push notification to ${token.platform}:`, {
          token: token.push_token,
          notification
        })
        
        // TODO: Implement actual push notification sending based on platform
        // iOS: Use Apple Push Notification service (APNs)
        // Android: Use Firebase Cloud Messaging (FCM)
        
        results.push({
          platform: token.platform,
          success: true,
          message: 'Notification queued (mock)'
        })
      } catch (error) {
        console.error(`Error sending to ${token.platform}:`, error)
        results.push({
          platform: token.platform,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications processed',
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})