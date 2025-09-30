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
        // Don't override storageKey - let Supabase use its default pattern
        // This ensures proper cross-tab synchronization
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
        timeout: 10000,
        transport: typeof window !== 'undefined' ? WebSocket : undefined,
        encode: (payload: any, callback: (encoded: any) => void) => {
          try {
            callback(JSON.stringify(payload))
          } catch (error) {
            console.error('Realtime encode error:', error)
            callback(payload)
          }
        },
        decode: (payload: string, callback: (decoded: any) => void) => {
          try {
            callback(JSON.parse(payload))
          } catch (error) {
            console.error('Realtime decode error:', error)
            callback(payload)
          }
        }
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

// Helper function to handle WebSocket connection errors
export const handleRealtimeError = (error: any) => {
  console.error('Supabase Realtime Error:', error)
  
  if (error.message?.includes('401')) {
    console.warn('WebSocket authentication failed. This may be due to:')
    console.warn('1. Realtime not enabled in Supabase dashboard')
    console.warn('2. Invalid API key for WebSocket connections')
    console.warn('3. Browser security policies blocking WebSocket')
  }
  
  return error
}

// Helper function to create a Realtime channel with error handling
export const createRealtimeChannel = (channelName: string, callback: (payload: any) => void) => {
  const client = getSupabaseClient()
  
  try {
    const channel = client
      .channel(channelName)
      .on('broadcast', { event: '*' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, callback)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Connected to Realtime channel: ${channelName}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error connecting to Realtime channel: ${channelName}`)
          handleRealtimeError(new Error('Channel subscription failed'))
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏰ Timeout connecting to Realtime channel: ${channelName}`)
        } else if (status === 'CLOSED') {
          console.log(`🔌 Disconnected from Realtime channel: ${channelName}`)
        }
      })
    
    return channel
  } catch (error) {
    console.error(`Error creating realtime channel ${channelName}:`, error)
    handleRealtimeError(error)
    return null
  }
}