import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-8 text-center border border-border">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mt-4">Page Not Found</h2>
          <p className="text-muted-foreground mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="text-primary hover:underline">
              Dashboard
            </Link>
            {' • '}
            <Link href="/playground" className="text-primary hover:underline">
              Playground
            </Link>
            {' • '}
            <Link href="/gigs" className="text-primary hover:underline">
              Gigs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
