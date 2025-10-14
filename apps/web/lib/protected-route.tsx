'use client'

import { useAuth } from './auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/auth/signin' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [loading, user, router, redirectTo])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted-50">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-muted-foreground-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user, don't render children (redirect will happen in useEffect)
  if (!user) {
    return null
  }

  return <>{children}</>
}