/**
 * Migration helper to handle the auth storage key change
 * This ensures existing users don't lose their sessions
 */

export function migrateAuthStorage() {
  if (typeof window === 'undefined') return

  try {
    // Check if old storage key exists
    const oldKey = 'sb-preset-auth-token'
    const newKey = 'supabase.auth.token'
    
    const oldToken = localStorage.getItem(oldKey)
    const newToken = localStorage.getItem(newKey)
    
    // If we have old token but no new token, migrate it
    if (oldToken && !newToken) {
      console.log('Migrating auth token from old storage key...')
      localStorage.setItem(newKey, oldToken)
      
      // Keep old key for a while to ensure compatibility
      // It will be cleaned up on next sign out
    }
    
    // Clean up old key if we have a valid new token
    if (newToken && oldToken) {
      localStorage.removeItem(oldKey)
      console.log('Cleaned up old auth storage key')
    }
  } catch (error) {
    console.error('Error migrating auth storage:', error)
  }
}

/**
 * Clear all auth-related storage
 * Useful for debugging or forcing a fresh auth state
 */
export function clearAuthStorage() {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove = [
      'sb-preset-auth-token',
      'supabase.auth.token',
      'supabase.auth.token.code_verifier',
      'supabase.auth.token.code_challenge'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    console.log('Cleared all auth storage')
  } catch (error) {
    console.error('Error clearing auth storage:', error)
  }
}
