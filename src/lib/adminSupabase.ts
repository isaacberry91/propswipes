import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// For admin operations, we'll use the regular client but with admin authentication
// This is safer than hardcoding service role keys
const SUPABASE_URL = "https://jkctleefoomwpaglrvie.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprY3RsZWVmb29td3BhZ2xydmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Nzg5NjAsImV4cCI6MjA2OTA1NDk2MH0.QGzHZYiP-m_ayMQ5RjYBLbSRd2J400E4c-UjHNvhmHg";

export const adminSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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