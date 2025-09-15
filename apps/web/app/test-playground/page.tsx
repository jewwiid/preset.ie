'use client'

export default function TestPlaygroundPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Playground</h1>
        <p className="text-gray-600 mb-8">This is a simple test page to verify Next.js is working.</p>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test API Connection</h2>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/user/credits')
                const data = await response.json()
                alert('API Response: ' + JSON.stringify(data))
              } catch (error) {
                alert('API Error: ' + (error instanceof Error ? error.message : String(error)))
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Test Credits API
          </button>
        </div>
      </div>
    </div>
  )
}
