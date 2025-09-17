'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { debugSession } from './session-debug'
import { getUserRole, UserRole } from './auth-helpers'

export interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: UserRole | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; redirectPath?: string }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we have a stored session
    const initializeAuth = async () => {
      try {
        // Debug session storage
        if (process.env.NODE_ENV === 'development') {
          debugSession()
        }
        
        // Get initial session
        if (!supabase) {
          console.error('Supabase client not available')
          return
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else {
          console.log('Initial session:', session ? 'Found' : 'Not found')
          if (session) {
            console.log('Session expires at:', new Date(session.expires_at! * 1000).toLocaleString())
            // Fetch user role when session is found
            const role = await getUserRole(session.user.id)
            setUserRole(role)
          }
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    if (!supabase) {
      console.error('Supabase client not available for auth state change listener')
      return
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        setUser(session?.user ?? null)
        
        // Update user role on auth state changes
        if (session?.user) {
          const role = await getUserRole(session.user.id)
          setUserRole(role)
        } else {
          setUserRole(null)
        }
        
        setLoading(false)
        
        // Handle token refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        }
      }
    )

    return () => subscription.unsubscribe()
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