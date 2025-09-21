'use client'

import React from 'react'
import { useAuth } from '../../lib/auth-context'
import { Button } from '../ui/button'
import { Sparkles, Lock, User } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export default function AuthGuard({ 
  children, 
  fallback, 
  redirectTo = '/auth/signin',
  requireAuth = true 
}: AuthGuardProps) {
  const { user, session, loading: authLoading } = useAuth()

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && (!user || !session)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
            <p className="text-gray-600 mb-6">
              You need to be signed in to access this page. This feature requires authentication to ensure secure access.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = redirectTo} 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth/signup'} 
              className="w-full"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated or authentication is not required
  return <>{children}</>
}

// Specialized guards for different page types
export function PlaygroundAuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard 
      requireAuth={true}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Playground Access</h1>
              <p className="text-gray-600 mb-6">
                You need to be signed in to access the Playground. This feature requires authentication to ensure secure access to AI generation tools.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/auth/signin'} 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Sign In to Playground
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/auth/signup'} 
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </AuthGuard>
  )
}

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard 
      requireAuth={true}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-primary/10 to-blue-100">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Access</h1>
              <p className="text-gray-600 mb-6">
                You need to be signed in to access your dashboard. This feature requires authentication to view your personal data and settings.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/auth/signin'} 
                className="w-full bg-gradient-to-r from-primary-primary to-blue-600 hover:from-primary-primary hover:to-blue-700"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/auth/signup'} 
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </AuthGuard>
  )
}
