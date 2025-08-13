import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Admin client with service role key - bypasses RLS for admin operations
const SUPABASE_URL = "https://jkctleefoomwpaglrvie.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprY3RsZWVmb29td3BhZ2xydmllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ3ODk2MCwiZXhwIjoyMDY5MDU0OTYwfQ.Y8cjYeKw_MBhxGwQJcSJu2VcJKYJvzKRKPUKlr-gBFo";

export const adminSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'x-client-info': 'propswipes-admin-panel'
    }
  }
});

// Admin authentication check
export const isAdminAuthenticated = (): boolean => {
  return localStorage.getItem("admin-authenticated") === "true";
};

// Admin logout
export const adminLogout = () => {
  localStorage.removeItem("admin-authenticated");
  localStorage.removeItem("admin-session-email");
};