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
    // Fetch profile using security definer function that bypasses RLS
    const { data: supabaseAuth } = await supabase.auth.getUser();
    
    if (supabaseAuth.user) {
      const { data: directProfile, error } = await supabase.rpc('get_matched_user_profile', { 
        target_profile_id: profileId,
        requesting_user_id: supabaseAuth.user.id
      });
        
      console.log('🔥 RESOLVE PROFILE - RPC fetch result:', directProfile);
      console.log('🔥 RESOLVE PROFILE - RPC fetch error:', error);
      
      // The RPC returns an array, take the first result
      const profileData = directProfile?.[0];
      
      if (profileData) {
        userProfile = profileData;
        
        if (profileData.display_name?.trim()) {
          userName = profileData.display_name.trim();
          console.log('🔥 RESOLVE PROFILE - Using RPC display_name:', userName);
        } else {
          // Final fallback based on user type
          userName = profileData.user_type === 'seller' ? 'Property Seller' : 'Property Buyer';
          console.log('🔥 RESOLVE PROFILE - Using user type fallback:', userName);
        }
      } else {
        console.log('🔥 RESOLVE PROFILE - No data from RPC, using fallback');
        userName = 'Property Contact';
      }
    } else {
      console.log('🔥 RESOLVE PROFILE - No authenticated user');
      userName = 'Property Contact';
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