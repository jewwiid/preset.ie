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
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>
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
        
        // Debug session storage
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
          console.error('Error getting session:', error)
          setSession(null)
          setUser(null)
          setUserRole(null)
        } else {
          console.log('Initial session:', session ? 'Found' : 'Not found')
          if (session) {
            console.log('Session expires at:', new Date(session.expires_at! * 1000).toLocaleString())
            // Fetch user role when session is found with error handling
            try {
              const role = await getUserRole(session.user.id)
              setUserRole(role)
            } catch (roleError) {
              console.error('Error fetching user role during initialization:', roleError)
              setUserRole(null)
            }
          } else {
            setUserRole(null)
          }
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
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
      console.error('Supabase client not available for auth state change listener')
      return () => {} // Return empty cleanup function
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id
        })

        const newUserId = session?.user?.id

        // Only update if user actually changed (prevent duplicate re-renders)
        if (newUserId === previousUserIdRef.current && event !== 'INITIAL_SESSION') {
          console.log('⏭️ Skipping duplicate auth event - user unchanged')
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
          console.error('Error fetching user role during auth state change:', error)
        }

        // Batch all state updates together using React 18 automatic batching
        setSession(session)
        setUser(session?.user ?? null)
        setUserRole(role)
        setLoading(false)

        // Log events
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in - should sync to all tabs')
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ User signed out - should sync to all tabs')
        } else if (event === 'INITIAL_SESSION') {
          console.log('✅ Initial session loaded')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: null }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    // Check if email confirmation is required
    const needsEmailConfirmation = !error && data.user && !data.session ? true : undefined
    
    return { error, needsEmailConfirmation }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: null }
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
          console.warn('Supabase sign out warning:', error.message)
        }
      }
      
      // Always return success since local state is cleared
      return { error: null }
    } catch (err) {
      // Even on error, local state is cleared so UI updates correctly
      console.warn('Sign out process warning:', err)
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