'use client'

import { useAuth } from '@/lib/auth-context'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function SessionDebugPage() {
  const { user, session, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      setSessionInfo({
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at,
        error: error?.message
      })
    }

    checkSession()
  }, [])

  const testStripeAPI = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setTestResult('❌ No session available')
        return
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          packageId: 'plus',
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`✅ API call successful: ${data.sessionId}`)
      } else {
        setTestResult(`❌ API call failed: ${data.error}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Session Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth Context</h2>
          <pre className="text-sm">
            {JSON.stringify({
              hasUser: !!user,
              userId: user?.id,
              userEmail: user?.email,
              hasSession: !!session,
              sessionUserId: session?.user?.id,
              sessionExpiresAt: session?.expires_at,
              loading
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Direct Session Check</h2>
          <pre className="text-sm">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Stripe API Test</h2>
          <button 
            onClick={testStripeAPI}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Stripe API Call
          </button>
          {testResult && (
            <div className="mt-2 p-2 bg-white rounded">
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
