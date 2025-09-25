'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!supabase) {
        setError('Supabase client not initialized')
        return
      }

      // Clear any existing OAuth state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-preset-auth-token')
        localStorage.removeItem('sb-preset-auth-token-code-verifier')
        sessionStorage.clear()
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Failed to initiate Google sign-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Test OAuth Flow
        </h1>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Initiating...' : 'Test Google OAuth'}
        </button>

        <p className="mt-4 text-sm text-gray-600">
          This will clear OAuth state and try a fresh flow
        </p>
      </div>
    </div>
  )
}
