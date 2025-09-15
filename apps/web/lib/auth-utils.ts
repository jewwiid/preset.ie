/**
 * Authentication Utilities
 * Helper functions for auth-related operations
 */

import { supabase } from './supabase'
import { NextRequest } from 'next/server'

export interface ResendEmailResult {
  success: boolean
  error?: string
}

/**
 * Resend confirmation email for a user
 * Works for both unverified and existing users
 */
export async function resendConfirmationEmail(email: string): Promise<ResendEmailResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase client not available'
      }
    }
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      console.error('Resend confirmation email error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Resend confirmation email exception:', err)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Check if an email is already registered and verified
 */
export async function checkEmailStatus(email: string): Promise<{
  exists: boolean
  verified: boolean
  error?: string
}> {
  try {
    if (!supabase) {
      return {
        exists: false,
        verified: false,
        error: 'Supabase client not available'
      }
    }
    
    // Try to sign in to check if user exists and is verified
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dummy-password' // This will fail but tell us if user exists
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        // User exists but wrong password, check if verified
        return { exists: true, verified: true }
      } else if (error.message.includes('Email not confirmed')) {
        // User exists but not verified
        return { exists: true, verified: false }
      } else {
        // User doesn't exist
        return { exists: false, verified: false }
      }
    }

    // If no error, user exists and is verified
    return { exists: true, verified: true }
  } catch (err) {
    console.error('Check email status error:', err)
    return {
      exists: false,
      verified: false,
      error: 'Could not check email status'
    }
  }
}

/**
 * Smart signup that handles existing users appropriately
 */
export async function smartSignup(email: string, password: string, options?: any) {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase client not available',
        shouldRedirectToSignIn: false
      }
    }
    
    // First check if user already exists
    const emailStatus = await checkEmailStatus(email)
    
    if (emailStatus.exists && emailStatus.verified) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
        shouldRedirectToSignIn: true
      }
    }

    // Proceed with signup (will work for new users or unverified existing users)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    })

    if (error) {
      return {
        success: false,
        error: error.message,
        shouldRedirectToSignIn: false
      }
    }

    return {
      success: true,
      data,
      isExistingUnverified: emailStatus.exists && !emailStatus.verified
    }
  } catch (err) {
    console.error('Smart signup error:', err)
    return {
      success: false,
      error: 'An unexpected error occurred',
      shouldRedirectToSignIn: false
    }
  }
}

/**
 * Extract user from NextRequest headers
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    if (!supabase) {
      return { user: null, error: 'Supabase client not initialized' }
    }
    
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return { user: null, error: 'No authorization header' }
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: 'Invalid token' }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('getUserFromRequest error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}
