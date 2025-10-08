'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { debugSession } from './session-debug'
import { getUserRole, UserRole } from './auth-helpers'
import { migrateAuthStorage } from './auth-migration'

export interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: UserRole | null
  loading: boolean
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; redirectPath?: string }>
  signInWithGoogle: () => Promise<{ error: AuthError | null; redirectPath?: string }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const previousUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Check if we have a stored session
    const initializeAuth = async () => {
      try {
        // Migrate auth storage first
        migrateAuthStorage()
        
        // Debug session storage - only in development
        if (process.env.NODE_ENV === 'development') {
          debugSession()
        }
        
        // Get initial session
        if (!supabase) {
          console.error('Supabase client not available')
          setLoading(false)
          return
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Error getting session:', error)
          }
          setSession(null)
          setUser(null)
          setUserRole(null)
        } else {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Initial session:', session ? 'Found' : 'Not found')
            if (session) {
              console.log('Session expires at:', new Date(session.expires_at! * 1000).toLocaleString())
            }
          }
          if (session) {
            // Fetch user role when session is found with error handling
            try {
              const role = await getUserRole(session.user.id)
              setUserRole(role)
            } catch (roleError) {
              // Only log in development
              if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching user role during initialization:', roleError)
              }
              setUserRole(null)
            }
          } else {
            setUserRole(null)
          }
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error initializing auth:', err)
        }
        // Reset all auth state on error
        setSession(null)
        setUser(null)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    if (!supabase) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase client not available for auth state change listener')
      }
      return () => {} // Return empty cleanup function
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔔 Auth state changed:', event, {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            userId: session?.user?.id
          })
        }

        const newUserId = session?.user?.id

        // Only update if user actually changed (prevent duplicate re-renders)
        if (newUserId === previousUserIdRef.current && event !== 'INITIAL_SESSION') {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('⏭️ Skipping duplicate auth event - user unchanged')
          }
          return
        }

        previousUserIdRef.current = newUserId

        // Update user role first (before state updates to batch re-renders)
        let role = null
        try {
          if (session?.user) {
            role = await getUserRole(session.user.id)
          }
        } catch (error) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching user role during auth state change:', error)
          }
        }

        // Batch all state updates together using React 18 automatic batching
        setSession(session)
        setUser(session?.user ?? null)
        setUserRole(role)
        setLoading(false)

        // Log events
        // Log events - only in development
        if (process.env.NODE_ENV === 'development') {
          if (event === 'SIGNED_IN') {
            console.log('✅ User signed in - should sync to all tabs')
          } else if (event === 'SIGNED_OUT') {
            console.log('✅ User signed out - should sync to all tabs')
          } else if (event === 'INITIAL_SESSION') {
            console.log('✅ Initial session loaded')
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    if (!supabase) {
      return { error: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.data || {}
      }
    })

    // Check if email confirmation is required
    const needsEmailConfirmation = !error && data.user && !data.session ? true : undefined

    return { error, needsEmailConfirmation }
  }

  const signIn = async (emailOrHandle: string, password: string) => {
    if (!supabase) {
      return { error: null }
    }

    let email = emailOrHandle

    // Check if input is a handle (doesn't contain @) instead of email
    if (!emailOrHandle.includes('@')) {
      try {
        // Look up email from handle via API
        const response = await fetch('/api/auth/handle-to-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle: emailOrHandle })
        })

        if (!response.ok) {
          return {
            error: {
              message: 'Invalid handle or password',
              name: 'AuthError',
              status: 400
            } as AuthError,
            redirectPath: undefined
          }
        }

        const { email: userEmail } = await response.json()
        if (!userEmail) {
          return {
            error: {
              message: 'Invalid handle or password',
              name: 'AuthError',
              status: 400
            } as AuthError,
            redirectPath: undefined
          }
        }

        email = userEmail
      } catch (err) {
        return {
          error: {
            message: 'An error occurred during sign in',
            name: 'AuthError',
            status: 500
          } as AuthError,
          redirectPath: undefined
        }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    let redirectPath = '/dashboard'

    if (!error && data.user) {
      // Get user role to determine redirect path
      const role = await getUserRole(data.user.id)
      setUserRole(role)

      if (role?.isAdmin) {
        redirectPath = '/admin'
      } else {
        // Check if user has a complete profile
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users_profile')
            .select('id')
            .eq('user_id', data.user.id)
            .single()

          // If no profile exists, redirect to complete-profile
          if (profileError?.code === 'PGRST116' || !profile) {
            redirectPath = '/auth/complete-profile'
          }
        } catch (profileCheckError) {
          console.error('Error checking profile completion:', profileCheckError)
          // On error, assume profile is incomplete and redirect to complete-profile
          redirectPath = '/auth/complete-profile'
        }
      }
    }

    return { error, redirectPath }
  }

  const signOut = async () => {
    try {
      // Clear local state immediately for instant UI feedback
      setUser(null)
      setSession(null)
      setUserRole(null)
      
      // Check if there's an active session before trying to sign out
      if (!supabase) {
        console.error('Supabase client not available for sign out')
        return { error: null }
      }
      
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        // Only attempt sign out if there's an active session
        const { error } = await supabase.auth.signOut({ scope: 'local' })
        
        if (error) {
          // Log the error but don't throw - we've already cleared local state
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Supabase sign out warning:', error.message)
          }
        }
      }
      
      // Always return success since local state is cleared
      return { error: null }
    } catch (err) {
      // Even on error, local state is cleared so UI updates correctly
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Sign out process warning:', err)
      }
      return { error: null }
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: null }
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    let redirectPath = '/dashboard'
    
    // Note: OAuth flow doesn't provide user data immediately
    // User role will be determined after callback in the auth callback page
    
    return { error, redirectPath }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: null }
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    })
    
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    userRole,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}