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
  signInWithGoogle: (inviteCode?: string) => Promise<{ error: AuthError | null; redirectPath?: string }>
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
    // Migrate auth storage first
    migrateAuthStorage()

    // Debug session storage - only in development
    if (process.env.NODE_ENV === 'development') {
      debugSession()
    }

    // Listen for auth changes - no need to call getSession() manually
    // onAuthStateChange will handle initial session automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Add error boundary for auth state changes
        try {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔔 Auth state changed:', event, {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            userId: session?.user?.id,
            fullUser: session?.user
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

        // If session was lost unexpectedly, try to recover it
        if (!session && previousUserIdRef.current && event !== 'SIGNED_OUT') {
          console.log('Session lost unexpectedly, attempting to recover...')
          // Try to refresh the session manually if it was lost unexpectedly
          try {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Failed to refresh session:', refreshError.message)
            } else if (refreshedSession) {
              console.log('Session recovered successfully')
            }
          } catch (refreshError) {
            console.error('Error refreshing session:', refreshError)
          }
        }

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
        } catch (error) {
          console.error('Error in auth state change handler:', error)
          // Don't let auth errors crash the app
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
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
      password})

    let redirectPath = '/dashboard'

    if (!error && data.user) {
      // Get user role to determine redirect path
      const role = await getUserRole(data.user.id)
      setUserRole(role)

      if (role?.isAdmin) {
        redirectPath = '/admin'
      } else {
        // Check if user has a profile (profile is only created after email verification)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users_profile')
            .select('id, email_verified')
            .eq('user_id', data.user.id)
            .single()

          // If no profile exists, user hasn't verified email yet
          if (profileError?.code === 'PGRST116' || !profile) {
            redirectPath = '/auth/verification-pending'
          } else if (profile && !profile.email_verified) {
            // Profile exists but not verified (edge case from old flow)
            redirectPath = '/auth/verification-pending'
          }
        } catch (profileCheckError) {
          console.error('Error checking profile:', profileCheckError)
          // On error, redirect to verification page for safety
          redirectPath = '/auth/verification-pending'
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

      // Sign out - this will trigger onAuthStateChange
      const { error } = await supabase.auth.signOut({ scope: 'local' })

      if (error) {
        // Log the error but don't throw - we've already cleared local state
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Supabase sign out warning:', error.message)
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

  const signInWithGoogle = async (inviteCode?: string) => {
    // Store invite code in session storage if provided
    if (inviteCode) {
      sessionStorage.setItem('preset_oauth_invite_code', inviteCode)
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'}
      }
    })
    
    let redirectPath = '/dashboard'
    
    // Note: OAuth flow doesn't provide user data immediately
    // User role will be determined after callback in the auth callback page
    
    return { error, redirectPath }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`})
    
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
    resetPassword}

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