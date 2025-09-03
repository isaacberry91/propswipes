import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "@/services/notificationService";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 PropSwipes Auth: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 PropSwipes Auth: Auth state changed', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email 
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle Apple ID mapping for sign-ins
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          const isAppleUser = session.user.app_metadata?.provider === 'apple' || session.user.user_metadata?.provider === 'apple';
          
          if (isAppleUser) {
            console.log('🔐 PropSwipes Auth: Apple user detected, handling mapping...', {
              hasEmail: !!session.user.email,
              hasFullName: !!(session.user.user_metadata?.full_name || session.user.user_metadata?.name),
              event,
              userMetadata: session.user.user_metadata,
              appMetadata: session.user.app_metadata
            });
            
            // Check if name and email are missing (subsequent sign-ins)
            const hasUserData = session.user.email && (session.user.user_metadata?.full_name || session.user.user_metadata?.name);
            const appleId = session.user.user_metadata?.sub || session.user.app_metadata?.provider_id;
            
            if (!hasUserData && appleId) {
              console.log('🔐 PropSwipes Auth: Apple user missing data, checking mapping...', { appleId });
              
              // Check if Apple ID exists in mapping table
              try {
                const { data: mapping, error: mappingError } = await supabase
                  .from('apple_id_mappings')
                  .select('*')
                  .eq('apple_id', appleId)
                  .maybeSingle();
                
                if (mappingError) {
                  console.error('🔐 PropSwipes Auth: Error checking Apple mapping:', mappingError);
                } else if (!mapping) {
                  console.error('🔐 PropSwipes Auth: Apple ID not found in mapping table');
                  
                  // Sign out the user and show error
                  await supabase.auth.signOut();
                  
                  // Show error toast using the global toast function
                  const { toast } = await import('@/hooks/use-toast');
                  setTimeout(() => {
                    toast({
                      title: "Apple Sign In Error",
                      description: "Please follow these steps: Open Settings → Tap your name → Go to Password & Security → Apps using your Apple ID → Select the app → Tap Stop Using Apple ID.",
                      variant: "destructive",
                      duration: 10000,
                    });
                  }, 100);
                  
                  return;
                } else {
                  console.log('🔐 PropSwipes Auth: Found Apple mapping, proceeding with auth');
                }
              } catch (error) {
                console.error('🔐 PropSwipes Auth: Exception checking Apple mapping:', error);
                // Sign out on error
                await supabase.auth.signOut();
                return;
              }
            }
            
            // Determine if this is the first login by checking available data
            const isFirstLogin = event === 'SIGNED_IN' && hasUserData;
            
            try {
              const { data, error } = await supabase.functions.invoke('handle-apple-auth', {
                body: { user: session.user, isFirstLogin }
              });
              
              if (error) {
                console.error('🔐 PropSwipes Auth: Apple mapping error:', error);
              } else {
                console.log('🔐 PropSwipes Auth: Apple mapping handled successfully');
              }
            } catch (error) {
              console.error('🔐 PropSwipes Auth: Apple mapping exception:', error);
            }
          }

          // Register push token when user signs in
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              notificationService.registerCurrentToken();
            }, 1000); // Small delay to ensure session is fully established
          }
        }
      }
    );

    // Get initial session
    console.log('🔐 PropSwipes Auth: Getting initial session');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔐 PropSwipes Auth: Initial session result', { 
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: error ? { name: error.name, message: error.message } : null 
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Register push token for existing session
      if (session?.user) {
        setTimeout(() => {
          notificationService.registerCurrentToken();
        }, 2000); // Slightly longer delay for initial session
      }
    }).catch((error) => {
      console.error('🔐 PropSwipes Auth: Error getting initial session', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    console.log('🔐 PropSwipes Auth: Signing out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('🔐 PropSwipes Auth: Sign out error', error);
      } else {
        console.log('🔐 PropSwipes Auth: Sign out successful');
      }
    } catch (error) {
      console.error('🔐 PropSwipes Auth: Sign out exception', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};