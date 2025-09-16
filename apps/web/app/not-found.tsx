import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            {' • '}
            <Link href="/playground" className="text-blue-600 hover:underline">
              Playground
            </Link>
            {' • '}
            <Link href="/gigs" className="text-blue-600 hover:underline">
              Gigs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
