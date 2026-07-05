import { createClient } from '@supabase/supabase-js'

// Server-only. Uses the service role key which bypasses RLS.
// NEVER import this in a Client Component ('use client').
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)