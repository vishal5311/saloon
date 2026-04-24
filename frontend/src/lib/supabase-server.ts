import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using the service_role key
// This bypasses Row Level Security (RLS) and is meant for API routes only
// NEVER expose this client to the browser

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njeaekidfetlwcvxqlmm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Fallback to anon key ONLY if explicitly needed, but for server operations we strictly need service role
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZWFla2lkZmV0bHdjdnhxbG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDI5NjcsImV4cCI6MjA5MjQxODk2N30.OqVp7MZYM2BMUpIz1ucuwrXBqsu70BL_nZRtQIGJuu8'

// If SUPABASE_SERVICE_ROLE_KEY is missing, we log a critical error but try to proceed (which will likely fail RLS)
if (!supabaseServiceKey) {
  console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. Backend inserts will fail with RLS errors.");
}

const key = supabaseServiceKey || supabaseAnonKey;

export const supabaseServer = createClient(supabaseUrl, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
