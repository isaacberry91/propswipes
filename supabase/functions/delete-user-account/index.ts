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

    // Get the current user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting account for user:', user.id);

    // Step 1: Delete all user-related data first
    console.log('Cleaning up user data...');
    
    // Delete user properties
    const { error: propertiesError } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('owner_id', user.id);

    if (propertiesError) {
      console.error('Error deleting properties:', propertiesError);
    }

    // Delete user likes
    const { error: likesError } = await supabaseAdmin
      .from('likes')
      .delete()
      .eq('user_id', user.id);

    if (likesError) {
      console.error('Error deleting likes:', likesError);
    }

    // Delete user matches
    const { error: matchesError } = await supabaseAdmin
      .from('matches')
      .delete()
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (matchesError) {
      console.error('Error deleting matches:', matchesError);
    }

    // Delete user messages
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('sender_id', user.id);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
    }

    // Delete user subscriptions
    const { error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('user_id', user.id);

    if (subscribersError) {
      console.error('Error deleting subscriptions:', subscribersError);
    }

    // Step 2: Mark profile as deleted (soft delete)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error marking profile as deleted:', profileError);
      throw new Error('Failed to delete profile data');
    }

    // Step 3: Delete user from auth using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError);
      throw new Error('Failed to delete user account');
    }

    console.log('Successfully deleted user account:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
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