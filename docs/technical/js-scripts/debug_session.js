// Debug session information
console.log('🔍 Debug Session Information')
console.log('============================')

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected')
  
  // Check for common session storage locations
  const sessionStorage = window.sessionStorage
  const localStorage = window.localStorage
  
  console.log('📦 Session Storage keys:', Object.keys(sessionStorage))
  console.log('📦 Local Storage keys:', Object.keys(localStorage))
  
  // Look for Supabase session data
  const supabaseSession = sessionStorage.getItem('supabase.auth.token') || 
                         localStorage.getItem('supabase.auth.token') ||
                         sessionStorage.getItem('sb-localhost-auth-token') ||
                         localStorage.getItem('sb-localhost-auth-token')
  
  if (supabaseSession) {
    console.log('✅ Found Supabase session data')
    try {
      const parsed = JSON.parse(supabaseSession)
      console.log('🔑 Session data:', parsed)
    } catch (e) {
      console.log('❌ Could not parse session data:', e.message)
    }
  } else {
    console.log('❌ No Supabase session data found')
  }
  
} else {
  console.log('🖥️ Node.js environment - run this in browser console')
}
