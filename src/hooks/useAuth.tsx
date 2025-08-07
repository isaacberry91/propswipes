import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
      (event, session) => {
        console.log('🔐 PropSwipes Auth: Auth state changed', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email 
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
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