'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function DebugMediaPage() {
  const { user, session } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const debugMedia = async () => {
      if (!user || !session?.access_token) {
        setDebugInfo({ error: 'No user or session' })
        setLoading(false)
        return
      }

      try {
        console.log('Debug: Making request with token length:', session.access_token.length)

        const response = await fetch('/api/media', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Debug: Response status:', response.status)
        console.log('Debug: Response headers:', Object.fromEntries(response.headers.entries()))

        const data = await response.json()
        console.log('Debug: Response data:', data)

        setDebugInfo({
          status: response.status,
          data: data,
          user: user.id,
          sessionExists: !!session,
          tokenLength: session.access_token.length
        })
      } catch (error) {
        console.error('Debug: Error:', error)
        setDebugInfo({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    debugMedia()
  }, [user, session])

  if (!user) {
    return <div>Please log in</div>
  }

  if (loading) {
    return <div>Loading debug info...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Media API Debug</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Debug Information:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">What this shows:</h2>
        <ul className="text-sm list-disc list-inside">
          <li>If you see "success: true" and media items, the API is working</li>
          <li>If you see "success: false" or errors, there's an API issue</li>
          <li>If you see 401 errors, there's an authentication issue</li>
          <li>The dashboard should show the same number of items as "media.length" in the response</li>
        </ul>
      </div>
    </div>
  )
}