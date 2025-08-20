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

    const { method, contact, type } = await req.json();

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabaseClient
      .from('two_factor_codes')
      .insert({
        user_id: user.id,
        code: otpCode,
        contact: contact,
        type: type,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      throw insertError;
    }

    if (type === 'email') {
      // Send email OTP (using Supabase's built-in email service)
      const emailBody = `
        <h2>PropSwipes Two-Factor Authentication</h2>
        <p>Your verification code is: <strong>${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `;

      // For now, we'll use a simple email service
      // In production, you might want to use SendGrid, AWS SES, etc.
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PropSwipes <noreply@propswipes.com>',
          to: [contact],
          subject: 'Your PropSwipes 2FA Code',
          html: emailBody,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send email:', await emailResponse.text());
        // Fallback: still return success but log error
      }
    } else if (type === 'sms') {
      // Send SMS OTP (using Twilio or similar service)
      const smsBody = `PropSwipes verification code: ${otpCode}. Valid for 10 minutes.`;

      const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: Deno.env.get('TWILIO_PHONE_NUMBER') || '',
          To: contact,
          Body: smsBody,
        }),
      });

      if (!smsResponse.ok) {
        console.error('Failed to send SMS:', await smsResponse.text());
        // Fallback: still return success but log error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Verification code sent to your ${type}`,
        expiresAt: expiresAt.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-2fa-code:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send verification code' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});