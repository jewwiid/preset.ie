import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted-50">
      <div className="max-w-md w-full bg-background shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-muted-foreground-300">404</h1>
          <h2 className="text-2xl font-semibold text-muted-foreground-800 mt-4">Page Not Found</h2>
          <p className="text-muted-foreground-600 mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-primary-600 text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-muted-foreground-500">
            <Link href="/dashboard" className="text-primary-600 hover:underline">
              Dashboard
            </Link>
            {' • '}
            <Link href="/playground" className="text-primary-600 hover:underline">
              Playground
            </Link>
            {' • '}
            <Link href="/gigs" className="text-primary-600 hover:underline">
              Gigs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
