'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
          // No profile found - check if OAuth user (Google)
          const isOAuthUser = user.app_metadata?.provider === 'google' || 
                             user.app_metadata?.providers?.includes('google');
          
          if (isOAuthUser) {
            // OAuth users have verified emails - but must check invite-only mode first
            if (process.env.NODE_ENV === 'development') {
              console.log('🚀 CALLBACK PAGE: OAuth user detected, checking invite-only mode')
            }
            
            // Check if invite-only mode is active
            const { data: inviteSetting } = await supabase!
              .from('platform_settings')
              .select('value')
              .eq('key', 'invite_only_mode')
              .single();
            
            const inviteOnlyMode = inviteSetting?.value ?? false;
            
            if (inviteOnlyMode) {
              // Get invite code from session storage (stored before OAuth redirect)
              const inviteCode = sessionStorage.getItem('preset_oauth_invite_code');
              
              if (!inviteCode) {
                // No invite code provided - reject signup
                if (process.env.NODE_ENV === 'development') {
                  console.error('🚀 CALLBACK PAGE: Invite-only mode active but no invite code provided')
                }
                setStatus('error');
                setMessage('An invite code is required to sign up. Please use an invite link.');
                
                // Delete the auth user since we can't create their profile
                try {
                  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                  
                  if (supabaseServiceKey) {
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                      auth: { autoRefreshToken: false, persistSession: false }
                    });
                    await supabaseAdmin.auth.admin.deleteUser(user.id);
                  }
                } catch (err) {
                  console.error('Failed to cleanup auth user:', err);
                }
                
                setTimeout(() => router.push('/auth/invite-required'), 3000);
                return;
              }
              
              // Validate the invite code
              const normalizedCode = inviteCode.trim().toUpperCase();
              const { data: inviteCodeData, error: codeError } = await supabase!
                .from('invite_codes')
                .select('id, status, used_by_user_id, expires_at, created_by_user_id')
                .eq('code', normalizedCode)
                .single();
              
              if (codeError || !inviteCodeData) {
                setStatus('error');
                setMessage('Invalid invite code. Please check your invite link and try again.');
                
                // Cleanup auth user
                try {
                  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                  
                  if (supabaseServiceKey) {
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                      auth: { autoRefreshToken: false, persistSession: false }
                    });
                    await supabaseAdmin.auth.admin.deleteUser(user.id);
                  }
                } catch (err) {
                  console.error('Failed to cleanup auth user:', err);
                }
                
                setTimeout(() => router.push('/auth/signup'), 3000);
                return;
              }
              
              // Check if code is already used
              if (inviteCodeData.status === 'used') {
                setStatus('error');
                setMessage('This invite code has already been used.');
                
                // Cleanup auth user
                try {
                  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                  
                  if (supabaseServiceKey) {
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                      auth: { autoRefreshToken: false, persistSession: false }
                    });
                    await supabaseAdmin.auth.admin.deleteUser(user.id);
                  }
                } catch (err) {
                  console.error('Failed to cleanup auth user:', err);
                }
                
                setTimeout(() => router.push('/auth/signup'), 3000);
                return;
              }
              
              // Check if code is expired
              if (inviteCodeData.status === 'expired' ||
                  (inviteCodeData.expires_at && new Date(inviteCodeData.expires_at) < new Date())) {
                setStatus('error');
                setMessage('This invite code has expired.');
                
                // Cleanup auth user
                try {
                  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                  
                  if (supabaseServiceKey) {
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                      auth: { autoRefreshToken: false, persistSession: false }
                    });
                    await supabaseAdmin.auth.admin.deleteUser(user.id);
                  }
                } catch (err) {
                  console.error('Failed to cleanup auth user:', err);
                }
                
                setTimeout(() => router.push('/auth/signup'), 3000);
                return;
              }
              
              // Valid invite code - will mark as used after profile creation
            }
            
            const metadata = user.user_metadata;
            const fullName = metadata.full_name || metadata.name || 'User';
            const [firstName, ...lastNameParts] = fullName.split(' ');
            const lastName = lastNameParts.join(' ') || firstName;
            
            // Create profile with email_verified=TRUE
            const { error: createError } = await supabase!
              .from('users_profile')
              .insert({
                user_id: user.id,
                display_name: fullName,
                handle: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`,
                role_flags: ['TALENT'], // Default, user can change later
                first_name: firstName,
                last_name: lastName,
                email_verified: true, // OAuth emails are pre-verified!
                email_verified_at: new Date().toISOString(),
                availability_status: 'Available',
                invited_by_code: inviteOnlyMode && sessionStorage.getItem('preset_oauth_invite_code') ? 
                                 sessionStorage.getItem('preset_oauth_invite_code')!.trim().toUpperCase() : null,
              });
            
            if (createError) {
              console.error('Failed to create OAuth profile:', createError);
              router.replace('/auth/complete-profile');
            } else {
              // If invite code was used, mark it as used
              const storedInviteCode = sessionStorage.getItem('preset_oauth_invite_code');
              if (inviteOnlyMode && storedInviteCode) {
                try {
                  const normalizedCode = storedInviteCode.trim().toUpperCase();
                  
                  // Get the invite code details
                  const { data: codeData } = await supabase!
                    .from('invite_codes')
                    .select('id, created_by_user_id')
                    .eq('code', normalizedCode)
                    .single();
                  
                  if (codeData) {
                    // Get the profile ID we just created
                    const { data: newProfile } = await supabase!
                      .from('users_profile')
                      .select('id')
                      .eq('user_id', user.id)
                      .single();
                    
                    // Mark code as used
                    await supabase!
                      .from('invite_codes')
                      .update({
                        status: 'used',
                        used_at: new Date().toISOString(),
                        used_by_user_id: newProfile?.id
                      })
                      .eq('code', normalizedCode);
                    
                    // Send referral notification if applicable
                    if (codeData.created_by_user_id) {
                      try {
                        const { data: referrerProfile } = await supabase!
                          .from('users_profile')
                          .select('user_id, display_name')
                          .eq('id', codeData.created_by_user_id)
                          .single();
                        
                        if (referrerProfile) {
                          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                          await fetch(`${baseUrl}/api/emails/new-signup-notification`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              referrerUserId: referrerProfile.user_id,
                              referrerName: referrerProfile.display_name,
                              newUserName: fullName,
                              inviteCode: normalizedCode
                            })
                          });
                        }
                      } catch (emailError) {
                        console.error('Error sending signup notification:', emailError);
                      }
                    }
                  }
                } catch (inviteError) {
                  console.error('Error processing invite code:', inviteError);
                }
              }
              
              // Clean up session storage
              sessionStorage.removeItem('preset_oauth_invite_code');
              
              setMessage('Welcome! Redirecting to your dashboard...')
              router.replace('/dashboard');
            }
          } else {
            // Email signup - redirect to complete profile or verification pending
            if (process.env.NODE_ENV === 'development') {
              console.log('🚀 CALLBACK PAGE: Email signup user, needs verification')
            }
            setMessage('Please verify your email to continue...')
            router.replace('/auth/verification-pending')
          }
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
            <LoadingSpinner size="xl" />
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
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}