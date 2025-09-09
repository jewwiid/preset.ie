export function debugSession() {
  if (typeof window === 'undefined') return

  console.group('🔐 Session Debug')
  
  // Check localStorage
  const keys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth') || key.includes('preset')
  )
  
  console.log('Auth-related localStorage keys:', keys)
  
  keys.forEach(key => {
    const value = localStorage.getItem(key)
    try {
      const parsed = JSON.parse(value || '{}')
      console.log(`${key}:`, {
        hasAccessToken: !!parsed.access_token,
        hasRefreshToken: !!parsed.refresh_token,
        expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : null,
        user: parsed.user?.email
      })
    } catch {
      console.log(`${key}:`, value?.substring(0, 50) + '...')
    }
  })
  
  // Check cookies
  console.log('Cookies:', document.cookie)
  
  console.groupEnd()
}