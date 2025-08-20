import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  user_type?: string;
  bio?: string;
  phone?: string;
  location?: string;
  user_id?: string;
}

export interface ResolvedUser {
  name: string;
  avatar: string;
  type: string;
  bio: string;
  phone: string;
  location: string;
  profileId: string;
}

/**
 * Resolves user profile information with proper fallbacks
 * Always tries to show real user data instead of generic placeholders
 */
export const resolveUserProfile = async (
  profileId: string,
  joinedProfile?: UserProfile | null
): Promise<ResolvedUser> => {
  let userName = 'Property Contact';
  let userProfile: UserProfile | null = null;

  console.log('🔥 RESOLVE PROFILE - Starting for ID:', profileId);
  console.log('🔥 RESOLVE PROFILE - Joined profile:', joinedProfile);

  // First try the joined profile data if available
  if (joinedProfile?.display_name?.trim()) {
    userProfile = joinedProfile;
    userName = joinedProfile.display_name.trim();
    console.log('🔥 RESOLVE PROFILE - Using joined profile display_name:', userName);
  } else {
    // Fetch profile directly from database
    const { data: directProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
      
    console.log('🔥 RESOLVE PROFILE - Direct fetch result:', directProfile);
    console.log('🔥 RESOLVE PROFILE - Direct fetch error:', error);
    
    if (directProfile) {
      userProfile = directProfile;
      
      if (directProfile.display_name?.trim()) {
        userName = directProfile.display_name.trim();
        console.log('🔥 RESOLVE PROFILE - Using direct fetch display_name:', userName);
      } else {
        // Try to get email from auth users as last resort
        try {
          const { data: profileWithEmail } = await supabase.rpc('get_profile_with_email', { 
            profile_user_id: directProfile.user_id 
          });
          
          console.log('🔥 RESOLVE PROFILE - RPC email result:', profileWithEmail);
          
          if (profileWithEmail?.[0]?.display_name?.trim()) {
            userName = profileWithEmail[0].display_name.trim();
            console.log('🔥 RESOLVE PROFILE - Using RPC display_name:', userName);
          } else if (profileWithEmail?.[0]?.email?.trim()) {
            // Use part of email as name if no display name exists
            userName = profileWithEmail[0].email.split('@')[0];
            console.log('🔥 RESOLVE PROFILE - Using email prefix as name:', userName);
          } else {
            // Final fallback based on user type
            userName = directProfile.user_type === 'seller' ? 'Property Seller' : 'Property Buyer';
            console.log('🔥 RESOLVE PROFILE - Using user type fallback:', userName);
          }
        } catch (rpcError) {
          console.error('🔥 RESOLVE PROFILE - RPC error:', rpcError);
          userName = directProfile.user_type === 'seller' ? 'Property Seller' : 'Property Buyer';
        }
      }
    }
  }

  // Use fallback profile if no profile found
  if (!userProfile) {
    userProfile = { 
      id: profileId, 
      user_type: 'buyer', 
      display_name: userName 
    };
  }

  console.log('🔥 RESOLVE PROFILE - Final resolved name:', userName);

  return {
    name: userName,
    avatar: userProfile.avatar_url || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
    type: userProfile.user_type === 'seller' ? 'Seller' : 'Buyer',
    bio: userProfile.bio?.trim() || 'No bio available',
    phone: userProfile.phone?.trim() || 'No phone provided',
    location: userProfile.location?.trim() || 'Location not provided',
    profileId: userProfile.id
  };
};