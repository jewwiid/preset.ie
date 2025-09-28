'use client'

import { useState } from 'react'
import { getAuthToken } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export default function MessageTestPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<any>(null)

  const testTokenExtraction = async () => {
    setLoading(true)
    setTestResult('Testing token extraction...')
    
    try {
      // Test the getAuthToken function
      const token = await getAuthToken()
      
      if (!token) {
        setTestResult('❌ No token found - please sign in first')
        setTokenInfo(null)
        return
      }

      setTokenInfo({
        hasToken: !!token,
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
        tokenEnd: '...' + token.substring(token.length - 20)
      })

      setTestResult('✅ Token extracted successfully!')
      
    } catch (error: any) {
      setTestResult(`❌ Token extraction error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testMessageAPI = async () => {
    setLoading(true)
    setTestResult('Testing message API call...')
    
    try {
      const token = await getAuthToken()
      if (!token) {
        setTestResult('❌ No token available for API test')
        return
      }

      // Test a simple API call to verify token works
      const response = await fetch('/api/marketplace/messages/conversations?listing_id=test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.status === 401) {
        setTestResult('❌ API returned 401 - token is invalid')
      } else if (response.status === 404) {
        setTestResult('✅ API call successful! (404 expected for test listing)')
      } else if (response.ok) {
        setTestResult('✅ API call successful!')
      } else {
        setTestResult(`⚠️ API returned ${response.status}: ${data.error || 'Unknown error'}`)
      }
      
    } catch (error: any) {
      setTestResult(`❌ API test error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSessionInfo = async () => {
    setLoading(true)
    setTestResult('Checking session info...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setTestResult(`❌ Session error: ${error.message}`)
        return
      }

      if (!session) {
        setTestResult('❌ No active session found')
        return
      }

      setTestResult(`✅ Session found! User: ${session.user.email}`)
      setTokenInfo({
        hasSession: true,
        userEmail: session.user.email,
        userId: session.user.id,
        expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
        tokenLength: session.access_token?.length || 0
      })
      
    } catch (error: any) {
      setTestResult(`❌ Session check error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSendMessage = async () => {
    setLoading(true)
    setTestResult('Testing message send API...')
    
    try {
      const token = await getAuthToken()
      if (!token) {
        setTestResult('❌ No token available')
        return
      }

      // Test the actual send message API with dummy data
      const testMessageData = {
        to_user_id: 'test-user-id',
        message_body: 'Test message from debug page',
        listing_id: 'test-listing-id'
      }

      const response = await fetch('/api/marketplace/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testMessageData)
      })

      const data = await response.json()
      
      if (response.status === 401) {
        setTestResult('❌ Send message API returned 401 - Invalid token')
      } else if (response.status === 400) {
        setTestResult('✅ Send message API working! (400 expected for test data)')
      } else if (response.status === 404) {
        setTestResult('✅ Send message API working! (404 expected for test user)')
      } else if (response.ok) {
        setTestResult('✅ Send message API working perfectly!')
      } else {
        setTestResult(`⚠️ Send message API returned ${response.status}: ${data.error || 'Unknown error'}`)
      }
      
    } catch (error: any) {
      setTestResult(`❌ Send message test error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Message API Test Page</h1>
      
      <div className="space-y-6">
        {/* Test Controls */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={testSessionInfo}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '1. Check Session'}
            </button>
            
            <button 
              onClick={testTokenExtraction}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '2. Test Token Extraction'}
            </button>
            
            <button 
              onClick={testMessageAPI}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '3. Test Message API'}
            </button>
            
            <button 
              onClick={testSendMessage}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '4. Test Send Message'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm min-h-20">
            {testResult || 'Click a test button to start...'}
          </div>
        </div>

        {/* Token Info */}
        {tokenInfo && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Token Information</h2>
            <pre className="text-sm bg-white p-4 rounded overflow-auto">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li><strong>Check Session:</strong> Verify you're signed in and have an active session</li>
            <li><strong>Test Token Extraction:</strong> Verify the getAuthToken() function works properly</li>
            <li><strong>Test Message API:</strong> Test a simple API call with the extracted token</li>
            <li><strong>Test Send Message:</strong> Test the actual send message API endpoint</li>
          </ol>
          <p className="mt-2 text-sm text-blue-700">
            <strong>Expected Results:</strong> All tests should show ✅ success messages. 
            If you see ❌ errors, the token extraction or API authentication needs fixing.
          </p>
        </div>
      </div>
    </div>
  )
}
