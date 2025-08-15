import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get OAuth2 access token
async function getAccessToken() {
  try {
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment')
    }

    const serviceAccount = JSON.parse(serviceAccountKey)
    
    // Create JWT payload
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    }
    
    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }
    
    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    // Import private key
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(serviceAccount.private_key.replace(/\\n/g, '\n')),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )
    
    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    )
    
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`
    
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`)
    }
    
    return tokenData.access_token
    
  } catch (error) {
    console.error('Failed to get OAuth2 access token:', error)
    throw error
  }
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
        if (token.platform === 'ios') {
          // Send to Apple Push Notification Service (APNs)
          const apnsResult = await sendAPNSNotification(token.push_token, notification)
          results.push({
            platform: token.platform,
            success: apnsResult.success,
            message: apnsResult.message || 'iOS notification sent'
          })
        } else if (token.platform === 'android') {
          // Send to Firebase Cloud Messaging (FCM)
          const fcmResult = await sendFCMNotification(token.push_token, notification)
          results.push({
            platform: token.platform,
            success: fcmResult.success,
            message: fcmResult.message || 'Android notification sent'
          })
        } else {
          // For web or unknown platforms, just log
          console.log(`Sending push notification to ${token.platform}:`, {
            token: token.push_token,
            notification
          })
          
          results.push({
            platform: token.platform,
            success: true,
            message: 'Notification logged (unsupported platform)'
          })
        }
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

// Helper function to send APNs notification
async function sendAPNSNotification(deviceToken: string, notification: any) {
  try {
    // For production, you would need:
    // 1. Apple Developer Account
    // 2. APNs key or certificate
    // 3. Your app's bundle ID
    
    // For now, return a mock response
    console.log('📱 Sending APNs notification:', {
      deviceToken,
      title: notification.title,
      body: notification.body,
      data: notification.data
    })
    
    return {
      success: true,
      message: 'APNs notification sent (mock implementation)'
    }
    
    // TODO: Implement real APNs call
    // const apnsResponse = await fetch('https://api.push.apple.com/3/device/' + deviceToken, {
    //   method: 'POST',
    //   headers: {
    //     'authorization': `bearer ${JWT_TOKEN}`,
    //     'apns-topic': 'your.bundle.id',
    //     'content-type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     aps: {
    //       alert: {
    //         title: notification.title,
    //         body: notification.body
    //       },
    //       sound: 'default'
    //     },
    //     data: notification.data
    //   })
    // })
    
  } catch (error) {
    console.error('APNs error:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// Helper function to send FCM notification using HTTP v1 API
async function sendFCMNotification(deviceToken: string, notification: any) {
  try {
    // Get service account info for project ID
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found')
    }
    
    const serviceAccount = JSON.parse(serviceAccountKey)
    const projectId = serviceAccount.project_id
    
    // Get OAuth2 access token
    const accessToken = await getAccessToken()
    
    // Prepare the message payload for FCM v1 API
    const message = {
      message: {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          notification: {
            channel_id: 'default',
            priority: 'HIGH',
            default_sound: true,
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              sound: 'default',
              badge: 1
            }
          }
        }
      }
    }
    
    console.log('📱 Sending FCM notification via HTTP v1 API:', {
      deviceToken,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      projectId
    })
    
    // Send the message using FCM v1 API
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })
    
    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('FCM API error:', responseData)
      
      // Handle specific FCM errors
      let errorMessage = responseData.error?.message || 'Unknown FCM error'
      const errorCode = responseData.error?.details?.[0]?.errorCode
      
      if (errorCode === 'UNREGISTERED' || responseData.error?.message?.includes('registration token is not valid')) {
        errorMessage = 'Token is not registered or has been unregistered'
      } else if (errorCode === 'INVALID_ARGUMENT' || responseData.error?.message?.includes('invalid')) {
        errorMessage = 'Invalid registration token'
      }
      
      return {
        success: false,
        message: errorMessage,
        code: errorCode,
        details: responseData.error
      }
    }
    
    console.log('FCM notification sent successfully:', responseData)
    
    return {
      success: true,
      message: 'FCM notification sent successfully',
      messageId: responseData.name
    }
    
  } catch (error) {
    console.error('FCM error:', error)
    return {
      success: false,
      message: error.message
    }
  }
}