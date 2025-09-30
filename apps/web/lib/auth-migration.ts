/**
 * Migration helper to handle the auth storage key change
 * This ensures existing users don't lose their sessions
 */

export function migrateAuthStorage() {
  if (typeof window === 'undefined') return

  try {
    // Get all localStorage keys that might contain old auth tokens
    const allKeys = Object.keys(localStorage)
    const oldCustomKeys = ['sb-preset-auth-token', 'supabase.auth.token']

    // Find the current Supabase auth key (format: sb-<project-ref>-auth-token)
    const currentSupabaseKey = allKeys.find(key =>
      key.match(/^sb-[a-z]{20}-auth-token$/)
    )

    if (!currentSupabaseKey) {
      // No current session, nothing to migrate
      return
    }

    const currentToken = localStorage.getItem(currentSupabaseKey)

    // Check for old custom keys and migrate if needed
    for (const oldKey of oldCustomKeys) {
      const oldToken = localStorage.getItem(oldKey)

      // If we have old token but no current token, migrate it
      if (oldToken && !currentToken) {
        console.log(`Migrating auth token from ${oldKey} to ${currentSupabaseKey}...`)
        localStorage.setItem(currentSupabaseKey, oldToken)
      }

      // Clean up old key if we have a valid current token
      if (currentToken && oldToken) {
        localStorage.removeItem(oldKey)
        console.log(`Cleaned up old auth storage key: ${oldKey}`)
      }
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
    const allKeys = Object.keys(localStorage)

    // Remove any key that matches Supabase auth patterns
    const authKeyPatterns = [
      /^sb-.*-auth-token$/,           // sb-<project-ref>-auth-token
      /^sb-.*-auth-token-code-verifier$/,  // PKCE verifier
      /^supabase\.auth/,               // Legacy supabase.auth.* keys
      /^sb-preset-auth-token$/         // Old custom key
    ]

    allKeys.forEach(key => {
      if (authKeyPatterns.some(pattern => pattern.test(key))) {
        localStorage.removeItem(key)
        console.log(`Removed auth key: ${key}`)
      }
    })

    console.log('Cleared all auth storage')
  } catch (error) {
    console.error('Error clearing auth storage:', error)
  }
}
