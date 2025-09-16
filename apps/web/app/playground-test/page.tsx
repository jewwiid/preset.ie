'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'

export default function PlaygroundTestPage() {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  const [loading, setLoading] = useState(false)

  const testGeneration = async () => {
    if (!user || !session) {
      showFeedback({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to test the playground generation.'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt: 'test a beautiful sunset',
          style: 'realistic',
          aspectRatio: '1:1',
          resolution: '1024*1024'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        console.error('Response Status:', response.status)
        throw new Error(errorData.error || `Failed to generate images (Status: ${response.status})`)
      }

      const data = await response.json()
      console.log('Generation successful:', data)
      showFeedback({
        type: 'success',
        title: 'Test Generation Successful!',
        message: 'Playground API is working correctly. Check console for details.'
      })
    } catch (error) {
      console.error('Test generation failed:', error)
      showFeedback({
        type: 'error',
        title: 'Test Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Playground Test</h1>
        
        {/* Authentication Status */}
        <div className="mb-4 p-3 rounded-md bg-gray-50">
          <p className="text-sm text-gray-600">
            <strong>Status:</strong> {user ? `Signed in as ${user.email}` : 'Not signed in'}
          </p>
          {!user && (
            <p className="text-xs text-red-600 mt-1">
              Please sign in to test the playground generation.
            </p>
          )}
        </div>
        
        <button
          onClick={testGeneration}
          disabled={loading || !user}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Test Generation
            </>
          )}
        </button>
      </div>
    </div>
  )
}
