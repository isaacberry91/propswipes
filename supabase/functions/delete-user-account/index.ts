import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for admin operations
    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.targetUserId;

    // Create admin client for user deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client for user auth
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    );

    // Get the current user making the request
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the user to delete
    let userToDelete = user.id;
    
    if (targetUserId) {
      // Admin deletion - check if current user is admin
      const isAdmin = ['admin@propswipes.com', 'support@propswipes.com', 'isaacberry91@yahoo.com', 'ankur@furrisic.com', 'developer@furrisic.com'].includes(user.email || '');
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required for deleting other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      userToDelete = targetUserId;
      console.log('Admin deleting account for user:', targetUserId, 'by admin:', user.email);
    } else {
      console.log('Self-deleting account for user:', user.id);
    }

    // Get user's profile ID first
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userToDelete)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Step 1: Delete all user-related data first
    console.log('Cleaning up user data...');
    
    // Delete user properties
    const { error: propertiesError } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('owner_id', profile.id);

    if (propertiesError) {
      console.error('Error deleting properties:', propertiesError);
    }

    // Delete user property swipes
    const { error: swipesError } = await supabaseAdmin
      .from('property_swipes')
      .delete()
      .eq('user_id', profile.id);

    if (swipesError) {
      console.error('Error deleting property swipes:', swipesError);
    }

    // Delete user matches (where user is buyer or seller)
    const { error: matchesError } = await supabaseAdmin
      .from('matches')
      .delete()
      .or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`);

    if (matchesError) {
      console.error('Error deleting matches:', matchesError);
    }

    // Delete user messages
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('sender_id', profile.id);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
    }

    // Delete user subscriptions
    const { error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('user_id', userToDelete);

    if (subscribersError) {
      console.error('Error deleting subscriptions:', subscribersError);
    }

    // Delete push tokens
    const { error: pushTokensError } = await supabaseAdmin
      .from('user_push_tokens')
      .delete()
      .eq('user_id', profile.id);

    if (pushTokensError) {
      console.error('Error deleting push tokens:', pushTokensError);
    }

    // Step 2: Mark profile as deleted (soft delete)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userToDelete);

    if (profileError) {
      console.error('Error marking profile as deleted:', profileError);
      throw new Error('Failed to soft delete profile');
    }

    console.log('Successfully soft deleted user account:', userToDelete);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deactivated successfully. You can reactivate by contacting support.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in delete-user-account function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});