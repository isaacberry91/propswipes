import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { initializeApp, cert } from "https://esm.sh/firebase-admin@12.0.0/app"
import { getMessaging } from "https://esm.sh/firebase-admin@12.0.0/messaging"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Firebase Admin SDK
let firebaseApp: any = null

function initializeFirebase() {
  if (firebaseApp) return firebaseApp

  try {
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment')
    }

    const serviceAccount = JSON.parse(serviceAccountKey)
    
    firebaseApp = initializeApp({
      credential: cert(serviceAccount)
    })
    
    console.log('Firebase Admin SDK initialized successfully')
    return firebaseApp
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error)
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

// Helper function to send FCM notification using Firebase Admin SDK
async function sendFCMNotification(deviceToken: string, notification: any) {
  try {
    // Initialize Firebase if not already done
    initializeFirebase()
    
    // Get the messaging instance
    const messaging = getMessaging()
    
    // Prepare the message payload
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          channelId: 'default',
          priority: 'high' as const,
          defaultSound: true,
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
    
    console.log('📱 Sending FCM notification via Admin SDK:', {
      deviceToken,
      title: notification.title,
      body: notification.body,
      data: notification.data
    })
    
    // Send the message
    const response = await messaging.send(message)
    
    console.log('FCM notification sent successfully:', response)
    
    return {
      success: true,
      message: 'FCM notification sent successfully',
      messageId: response
    }
    
  } catch (error) {
    console.error('FCM error:', error)
    
    // Handle specific FCM errors
    let errorMessage = error.message
    if (error.code === 'messaging/registration-token-not-registered') {
      errorMessage = 'Token is not registered or has been unregistered'
    } else if (error.code === 'messaging/invalid-registration-token') {
      errorMessage = 'Invalid registration token'
    }
    
    return {
      success: false,
      message: errorMessage,
      code: error.code
    }
  }
}