'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'

export default function PlaygroundTestPage() {
  const [loading, setLoading] = useState(false)

  const testGeneration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'a beautiful sunset',
          style: 'realistic',
          aspectRatio: '1:1',
          resolution: '1024*1024'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const data = await response.json()
      console.log('Generation successful:', data)
      alert('Test generation successful!')
    } catch (error) {
      console.error('Test generation failed:', error)
      alert('Test generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Playground Test</h1>
        
        <button
          onClick={testGeneration}
          disabled={loading}
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
