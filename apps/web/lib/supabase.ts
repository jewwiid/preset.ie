/**
 * Main Supabase client exports
 *
 * This file re-exports from the SSR client to maintain backward compatibility
 * while ensuring all code uses the same singleton instance.
 *
 * BEST PRACTICE: Import from this file for consistency
 * import { supabase } from '@/lib/supabase'
 *
 * @see https://supabase.com/docs/guides/auth/sessions
 */

import { createClient } from '@supabase/supabase-js'

// Re-export the singleton client from SSR module
export { supabase, createClient as createSSRClient } from './supabase/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Server-side Supabase client (uses service role key, bypasses RLS)
// This should ONLY be used in server-side code (API routes, server components)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Re-export helper functions for backward compatibility
import { supabase as clientInstance } from './supabase/client'

export const getSupabaseClient = () => {
  if (!clientInstance) {
    throw new Error('Supabase client not initialized. Check environment variables.')
  }
  return clientInstance
}

export const getAuthToken = async () => {
  const client = getSupabaseClient()
  const { data: { session }, error } = await client.auth.getSession()

  if (error || !session) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting session:', error)
    }
    return null
  }

  return session?.access_token
}

export const handleRealtimeError = (error: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Supabase Realtime Error:', error)

    if ((error as any).message?.includes('401')) {
      console.warn('WebSocket authentication failed. Check:')
      console.warn('1. Realtime enabled in Supabase dashboard')
      console.warn('2. Valid API key for WebSocket connections')
      console.warn('3. Browser security policies')
    }
  }

  return error
}

export const createRealtimeChannel = (channelName: string, callback: (payload: unknown) => void) => {
  const client = getSupabaseClient()

  try {
    const channel = client
      .channel(channelName)
      .on('broadcast', { event: '*' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, callback)
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
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
        }
      })

    return channel
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error creating realtime channel ${channelName}:`, error)
    }
    handleRealtimeError(error)
    return null
  }
}
