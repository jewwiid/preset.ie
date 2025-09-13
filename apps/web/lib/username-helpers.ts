import { supabase } from './supabase'

/**
 * Helper function to resolve username/handle to email for authentication
 * @param usernameOrEmail - Either a username/handle or email address
 * @returns The email address if username is found, or the original input if it's already an email
 */
export async function resolveUsernameToEmail(usernameOrEmail: string): Promise<{ email: string | null; error: string | null }> {
  // Check if input looks like an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (emailRegex.test(usernameOrEmail)) {
    // It's already an email, return as-is
    return { email: usernameOrEmail, error: null }
  }
  
  // It might be a username/handle, try to look it up
  try {
    if (!supabase) {
      return { 
        email: null, 
        error: 'Database connection not available. Please use your email address to sign in.'
      }
    }

    const { data, error } = await supabase
      .from('users_profile')
      .select('user_id')
      .eq('handle', usernameOrEmail.toLowerCase().replace('@', '')) // Handle @username format
      .single()
    
    if (error || !data) {
      return { 
        email: null, 
        error: `No account found with username "${usernameOrEmail}". Please use your email address or check your username.`
      }
    }
    
    // Use RPC function to securely resolve username to email
    try {
      const { data: resolvedEmail, error: rpcError } = await supabase
        .rpc('resolve_username_to_email', { username_input: usernameOrEmail })
      
      if (rpcError) {
        console.error('RPC error:', rpcError)
        return { 
          email: null, 
          error: `Error resolving username "${usernameOrEmail}". Please try using your email address.`
        }
      }
      
      if (!resolvedEmail) {
        return { 
          email: null, 
          error: `No account found with username "${usernameOrEmail}". Please check your username or use your email address.`
        }
      }
      
      return { email: resolvedEmail, error: null }
    } catch (error) {
      console.error('Username resolution error:', error)
      return { 
        email: null, 
        error: `Username lookup failed. Please use your email address to sign in.`
      }
    }
  } catch (error) {
    return { 
      email: null, 
      error: `Error looking up username "${usernameOrEmail}". Please use your email address to sign in.`
    }
  }
}

/**
 * Check if input string is likely a username vs email
 */
export function isEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(input)
}

/**
 * Format handle for display (with @ prefix if not present)
 */
export function formatHandle(handle: string): string {
  return handle.startsWith('@') ? handle : `@${handle}`
}