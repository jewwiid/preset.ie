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
      console.log('🚀 CALLBACK PAGE: Starting handleAuthCallback')
      console.log('🚀 CALLBACK PAGE: Current URL:', window.location.href)
      console.log('🚀 CALLBACK PAGE: Search params:', Object.fromEntries(searchParams.entries()))

      if (!supabase) {
        console.error('🚀 CALLBACK PAGE: Supabase client not available')
        setStatus('error')
        setMessage('Authentication service unavailable. Please try again.')
        return
      }

      // Check for error parameters first
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      
      if (error) {
        console.error('🚀 CALLBACK PAGE: Error in callback:', { error, errorDescription })
        setStatus('error')
        if (error === 'access_denied') {
          setMessage('Access was denied. Please try again and make sure to grant all requested permissions.')
        } else {
          setMessage(`Authentication failed: ${errorDescription || error}`)
        }
        return
      }

      // Check for OAuth code
      const code = searchParams.get('code')
      const hasState = searchParams.has('state')
      
      console.log('OAuth callback parameters:', { 
        code: !!code, 
        state: hasState 
      })

      if (code) {
        console.log('🚀 CALLBACK PAGE: Found code, waiting for automatic session establishment')
        
        // Set up auth state listener for session establishment
        console.log('🚀 CALLBACK PAGE: Setting up auth state listener')
        
        let sessionHandled = false
        let authSubscription: any = null
        
        const cleanupSubscription = () => {
          if (authSubscription) {
            try {
              authSubscription.unsubscribe()
              authSubscription = null
            } catch (e) {
              console.log('🚀 CALLBACK PAGE: Subscription already cleaned up')
            }
          }
        }
        
        authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🚀 CALLBACK PAGE: Auth state change:', event, { session: !!session, user: !!session?.user })
          
          if (event === 'SIGNED_IN' && session && session.user && !sessionHandled) {
            sessionHandled = true
            console.log('🚀 CALLBACK PAGE: Session established via listener!', { session: !!session, user: !!session?.user })
            
            // Clean up the listener
            cleanupSubscription()
            
            // Wait a moment for session to fully establish
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            console.log('🚀 CALLBACK PAGE: About to call handleProfileCheck from listener')
            // Check for profile
            await handleProfileCheck(session.user)
          }
        })

        // Also check immediately in case session is already established
        let attempts = 0
        const maxAttempts = 15
        
        const checkSession = async () => {
          // Don't continue if session was already handled by listener
          if (sessionHandled) {
            console.log('🚀 CALLBACK PAGE: Session already handled by listener, stopping direct check')
            return
          }
          
          attempts++
          console.log(`🚀 CALLBACK PAGE: Waiting for session... attempt ${attempts}/${maxAttempts}`)
          
          const { data: { session }, error: sessionError } = await supabase!.auth.getSession()
          
          console.log('🚀 CALLBACK PAGE: Session check result:', { 
            hasSession: !!session, 
            hasUser: !!session?.user, 
            error: sessionError 
          })
          
          if (session && session.user && !sessionHandled) {
            sessionHandled = true
            console.log('🚀 CALLBACK PAGE: Session found in direct check!')
            cleanupSubscription()
            await handleProfileCheck(session.user)
            return
          }
          
          if (attempts < maxAttempts && !sessionHandled) {
            setTimeout(checkSession, 1000)
          } else if (!sessionHandled) {
            cleanupSubscription()
            console.log('🚀 CALLBACK PAGE: Max session wait attempts reached')
            setStatus('error')
            setMessage('Session establishment timed out. Please try again.')
          }
        }
        
        // Start checking for session
        setTimeout(checkSession, 500)
        
      } else {
        // No code parameter, try to get existing session
        const { data: { session }, error: sessionError } = await supabase!.auth.getSession()
        
        if (sessionError) {
          console.error('🚀 CALLBACK PAGE: Session error:', sessionError)
          setStatus('error')
          setMessage('Failed to retrieve session. Please try again.')
          return
        }

        if (session && session.user) {
          console.log('🚀 CALLBACK PAGE: Existing session found')
          await handleProfileCheck(session.user)
        } else {
          setStatus('error')
          setMessage('No session found. Please try signing in again.')
        }
      }
    }

    const handleProfileCheck = async (user: any) => {
      console.log('🚀 CALLBACK PAGE: Checking for user profile:', user.id)
      
      setStatus('success')
      setMessage('Authentication successful! Checking your profile...')
      
      try {
        console.log('🚀 CALLBACK PAGE: Starting profile query...')
        
        // Quick profile check with timeout
        const profileResult = await Promise.race([
          supabase!
            .from('users_profile')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile check timeout')), 2000)
          )
        ]) as any

        console.log('🚀 CALLBACK PAGE: Profile query result:', { 
          hasData: !!profileResult.data, 
          hasError: !!profileResult.error,
          errorCode: profileResult.error?.code 
        })

        if (profileResult.data) {
          // Profile exists - redirect to dashboard immediately  
          console.log('🚀 CALLBACK PAGE: Profile found, redirecting to dashboard immediately')
          setMessage('Welcome back! Redirecting to your dashboard...')
          
          console.log('🚀 CALLBACK PAGE: Executing immediate redirect to dashboard')
          router.replace('/dashboard')
          return
          
        } else {
          // No profile found - redirect to profile creation immediately
          console.log('🚀 CALLBACK PAGE: No profile found, redirecting to profile creation immediately')
          setMessage('Authentication successful! Redirecting to complete your profile...')
          
          console.log('🚀 CALLBACK PAGE: Executing immediate redirect to profile creation')
          router.replace('/auth/create-profile')
          
          // Force redirect if router fails
          setTimeout(() => {
            if (window.location.pathname !== '/auth/create-profile') {
              console.log('🚀 CALLBACK PAGE: Force redirecting to profile creation')
              window.location.href = '/auth/create-profile'
            }
          }, 100)
          
          return
        }
        
      } catch (error: any) {
        console.log('🚀 CALLBACK PAGE: Profile check failed or timed out:', error.message)
        // On any error, redirect to profile creation page immediately
        setMessage('Authentication successful! Redirecting to complete your profile...')
        
        console.log('🚀 CALLBACK PAGE: Executing immediate redirect to profile creation (error case)')
        router.replace('/auth/create-profile')
        
        // Force redirect if router fails
        setTimeout(() => {
          if (window.location.pathname !== '/auth/create-profile') {
            console.log('🚀 CALLBACK PAGE: Force redirecting to profile creation (error case)')
            window.location.href = '/auth/create-profile'
          }
        }, 100)
        
        return
      }
    }

    handleAuthCallback()
    
    // Cleanup function for when component unmounts
    return () => {
      // Any cleanup needed when component unmounts
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {message.includes('Confirming') ? 'Confirming your email...' : message}
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 text-green-500 mx-auto mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Success!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 text-red-500 mx-auto mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Confirmation Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <button
              onClick={() => router.push('/auth/signup')}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}