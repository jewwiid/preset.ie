import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client-side Supabase client (uses anon key, subject to RLS)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token', // Use consistent key
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
        timeout: 10000
      }
    })
  : null

// Server-side Supabase client (uses service role key, bypasses RLS)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to validate Supabase client availability
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.')
  }
  return supabase
}

// Helper function to get auth token consistently
export const getAuthToken = async () => {
  const client = getSupabaseClient()
  const { data: { session } } = await client.auth.getSession()
  return session?.access_token
}