'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type Status = 'loading' | 'success' | 'error'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('Confirming your email...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 CALLBACK PAGE: Starting handleAuthCallback')
        console.log('🚀 CALLBACK PAGE: Current URL:', window.location.href)
        console.log('🚀 CALLBACK PAGE: Search params:', searchParams ? Object.fromEntries(searchParams.entries()) : {})
      }

      if (!supabase) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('🚀 CALLBACK PAGE: Supabase client not available')
        }
        setStatus('error')
        setMessage('Authentication service unavailable. Please try again.')
        return
      }

      // Check for error parameters first
      const error = searchParams?.get('error')
      const errorDescription = searchParams?.get('error_description')
      
      if (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('🚀 CALLBACK PAGE: Error in callback:', { error, errorDescription })
        }
        setStatus('error')
        if (error === 'access_denied') {
          setMessage('Access was denied. Please try again and make sure to grant all requested permissions.')
        } else {
          setMessage(`Authentication failed: ${errorDescription || error}`)
        }
        return
      }

      // Check for OAuth code
      const code = searchParams?.get('code')
      const hasState = searchParams?.has('state')
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('OAuth callback parameters:', {
          code: !!code,
          state: hasState
        })
      }

      if (code) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 CALLBACK PAGE: Found OAuth code, Supabase will automatically exchange it for session')
        }

        // First, check if session already exists (may have been established before we subscribed)
        const { data: { session: existingSession } } = await supabase!.auth.getSession()

        if (existingSession?.user) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 CALLBACK PAGE: Session already established, proceeding to profile check')
          }
          await handleProfileCheck(existingSession.user)
          return
        }

        // If no existing session, wait for SIGNED_IN event
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 CALLBACK PAGE: No existing session, waiting for auth state change...')
        }
        let sessionHandled = false
        const timeoutDuration = 10000 // 10 seconds max wait

        const timeout = setTimeout(() => {
          if (!sessionHandled) {
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.error('🚀 CALLBACK PAGE: Session establishment timed out')
            }
            setStatus('error')
            setMessage('Authentication is taking longer than expected. Please try signing in again.')
          }
        }, timeoutDuration)

        // Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 CALLBACK PAGE: Auth state change:', event, {
              hasSession: !!session,
              hasUser: !!session?.user,
              userEmail: session?.user?.email
            })
          }

          // Handle SIGNED_IN or INITIAL_SESSION with valid session
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !sessionHandled) {
            sessionHandled = true
            clearTimeout(timeout)

            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log('🚀 CALLBACK PAGE: Session established successfully!')
            }

            // Unsubscribe from further events
            subscription.unsubscribe()

            // Check for profile and redirect
            await handleProfileCheck(session.user)
          }
        })

        // Cleanup function
        return () => {
          clearTimeout(timeout)
          subscription.unsubscribe()
        }

      } else {
        // No code parameter, try to get existing session
        const { data: { session }, error: sessionError } = await supabase!.auth.getSession()
        
        if (sessionError) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.error('🚀 CALLBACK PAGE: Session error:', sessionError)
          }
          setStatus('error')
          setMessage('Failed to retrieve session. Please try again.')
          return
        }

        if (session && session.user) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 CALLBACK PAGE: Existing session found')
          }
          await handleProfileCheck(session.user)
        } else {
          setStatus('error')
          setMessage('No session found. Please try signing in again.')
        }
      }
    }

    const handleProfileCheck = async (user: any) => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 CALLBACK PAGE: Checking for user profile:', user.id)
      }

      setStatus('success')
      setMessage('Authentication successful! Checking your profile...')
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 CALLBACK PAGE: Starting profile query...')
      }

      try {
        console.log('🚀 CALLBACK PAGE: Starting profile query...')

        // Check for existing profile - no artificial timeout
        const { data: profile, error: profileError } = await supabase!
          .from('users_profile')
          .select('id, display_name, handle, account_status')
          .eq('user_id', user.id)
          .maybeSingle() // Use maybeSingle instead of single to avoid error on no rows
  
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 CALLBACK PAGE: Profile query result:', {
            hasData: !!profile,
            hasError: !!profileError,
            errorCode: profileError?.code
          })
        }

        if (profileError) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.error('🚀 CALLBACK PAGE: Profile query error:', profileError)
          }
          // On error, assume no profile and redirect to creation
          setMessage('Setting up your account...')
          router.replace('/auth/complete-profile')
          return
        }

        if (profile) {
          // Profile exists - redirect to dashboard
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 CALLBACK PAGE: Profile found, redirecting to dashboard')
          }
          setMessage('Welcome back! Redirecting to your dashboard...')
          router.replace('/dashboard')
        } else {
          // No profile found - redirect to profile creation
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 CALLBACK PAGE: No profile found, redirecting to profile creation')
          }
          setMessage('Setting up your account...')
          router.replace('/auth/complete-profile')
        }

      } catch (error: any) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('🚀 CALLBACK PAGE: Unexpected error in profile check:', error)
        }
        // On any unexpected error, redirect to profile creation
        setMessage('Setting up your account...')
        router.replace('/auth/complete-profile')
      }
    }

    handleAuthCallback()
    
    // Cleanup function for when component unmounts
    return () => {
      // Any cleanup needed when component unmounts
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-muted-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-background p-8 rounded-xl shadow-lg text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <h1 className="text-2xl font-bold text-muted-foreground-900 mb-2">
              {message.includes('Confirming') ? 'Confirming your email...' : message}
            </h1>
            <p className="text-muted-foreground-600">
              Please wait while we verify your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 text-primary-500 mx-auto mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-muted-foreground-900 mb-2">
              Success!
            </h1>
            <p className="text-muted-foreground-600 mb-6">
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 text-destructive-500 mx-auto mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-muted-foreground-900 mb-2">
              Confirmation Failed
            </h1>
            <p className="text-muted-foreground-600 mb-6">
              {message}
            </p>
            <button
              onClick={() => router.push('/auth/signup')}
              className="w-full bg-primary-600 text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted-50">
        <div className="max-w-md w-full bg-background rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}