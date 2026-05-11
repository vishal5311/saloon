import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using the service_role key
// This bypasses Row Level Security (RLS) and is meant for API routes only
// NEVER expose this client to the browser

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njeaekidfetlwcvxqlmm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// If SUPABASE_SERVICE_ROLE_KEY is missing, we log a critical error.
if (!supabaseServiceKey) {
  console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. Backend inserts will fail.");
}

// Custom fetch with 15-second timeout to handle Netlify cold-start network delays
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
};

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
})
