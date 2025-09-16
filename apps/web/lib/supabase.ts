import { createClient } from '@supabase/supabase-js'
// Type definitions will be generated from database schema later
type Database = any

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client-side Supabase client (uses anon key, subject to RLS)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-preset-auth-token',
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development'
      }
    })
  : null

// Server-side Supabase client (uses service role key, bypasses RLS)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null