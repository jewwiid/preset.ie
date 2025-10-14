'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../lib/auth-context'
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  Sparkles
} from 'lucide-react'
import { Logo } from '../../../components/Logo'
import { GoogleSignInButton } from '../../../components/auth/GoogleSignInButton'
import { AsyncButton } from '../../../components/ui/async-button'

function SignInContent() {
  const [emailOrHandle, setEmailOrHandle] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [inviteOnlyMode, setInviteOnlyMode] = useState(false)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [failedEmail, setFailedEmail] = useState<string>('')
  const [showErrorAnimation, setShowErrorAnimation] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for success messages from URL params
    if (searchParams?.get('reset-sent') === 'true') {
      setSuccessMessage('Password reset email sent! Check your inbox for instructions.')
    } else if (searchParams?.get('reset') === 'true') {
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.')
    }
  }, [searchParams])

  // Check if invite-only mode is active
  useEffect(() => {
    const checkInviteMode = async () => {
      try {
        const response = await fetch('/api/auth/validate-invite')
        const data = await response.json()
        setInviteOnlyMode(data.inviteOnlyMode)
      } catch (err) {
        console.error('Error checking invite mode:', err)
      }
    }
    checkInviteMode()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowSignupPrompt(false)
    setShowErrorAnimation(false)

    const { error, redirectPath } = await signIn(emailOrHandle, password)

    if (error) {
      setFailedEmail(emailOrHandle)
      
      // Since Supabase returns "Invalid login credentials" for both wrong password and non-existent user,
      // we need to check if the user exists to determine if we should show the signup prompt
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('invalid login credentials') || 
          errorMessage.includes('invalid email or password')) {
        
        // Check if user exists by trying to look them up
        try {
          const response = await fetch('/api/auth/check-user-exists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrHandle })
          })
          
          if (response.ok) {
            const { exists } = await response.json()
            if (!exists) {
              // User doesn't exist, show signup prompt
              setShowSignupPrompt(true)
            } else {
              // User exists but wrong password, show animation
              setShowErrorAnimation(true)
              setTimeout(() => {
                setShowErrorAnimation(false)
              }, 1000)
            }
          } else {
            // Fallback: show animation if we can't check
            setShowErrorAnimation(true)
            setTimeout(() => {
              setShowErrorAnimation(false)
            }, 1000)
          }
        } catch (err) {
          // Fallback: show animation if check fails
          setShowErrorAnimation(true)
          setTimeout(() => {
            setShowErrorAnimation(false)
          }, 1000)
        }
      } else {
        // For other errors, just show animation
        setShowErrorAnimation(true)
        setTimeout(() => {
          setShowErrorAnimation(false)
        }, 1000)
      }
      
      setLoading(false)
    } else {
      // Check for redirect parameter from URL first, then use auth context redirect
      const redirectTo = searchParams?.get('redirectTo')
      const finalRedirectPath = redirectTo || redirectPath || '/dashboard'
      router.push(finalRedirectPath)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo className="w-16 h-16" size={64} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your Preset account
          </p>
        </div>

        {/* Alert Messages - Only show for non-credential errors */}
        {error && !showErrorAnimation && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Signup Prompt for Failed Login */}
        {showSignupPrompt && (
          <div className="mb-6 bg-accent border border-border rounded-lg p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Don't have an account yet?
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                It looks like you might not have an account with this email. Join Preset and connect with amazing creative professionals!
              </p>
              <div className="flex justify-center">
                <Link
                  href={inviteOnlyMode 
                    ? "/auth/invite-required" 
                    : `/auth/signup${failedEmail ? `?email=${encodeURIComponent(failedEmail)}` : ''}`
                  }
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        {/* Google Sign-In */}
        <div className="mb-6">
          <GoogleSignInButton mode="signin" />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Sign In Form */}
        <form className={`space-y-6 transition-all duration-300 ${showErrorAnimation ? 'animate-shake' : ''}`} onSubmit={handleSubmit}>
          <div>
            <label htmlFor="emailOrHandle" className="block text-sm font-medium text-foreground mb-2">
              Email or Handle
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="emailOrHandle"
                name="emailOrHandle"
                type="text"
                autoComplete="username"
                required
                value={emailOrHandle}
                onChange={(e) => {
                  setEmailOrHandle(e.target.value)
                  // Clear animation when user starts typing
                  if (showErrorAnimation) {
                    setShowErrorAnimation(false)
                  }
                }}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all duration-300 ${
                  showErrorAnimation 
                    ? 'border-red-500 animate-pulse shadow-lg shadow-red-500/20' 
                    : 'border-border'
                }`}
                placeholder="Enter your email or handle"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  // Clear animation when user starts typing
                  if (showErrorAnimation) {
                    setShowErrorAnimation(false)
                  }
                }}
                className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all duration-300 ${
                  showErrorAnimation 
                    ? 'border-red-500 animate-pulse shadow-lg shadow-red-500/20' 
                    : 'border-border'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <AsyncButton
            type="submit"
            isLoading={loading}
            loadingText="Signing in..."
            icon={ArrowRight}
            iconPosition="right"
            className="w-full px-6 py-3 text-base font-medium"
          >
            Sign in
          </AsyncButton>

          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <span className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={inviteOnlyMode ? "/auth/invite-required" : "/auth/signup"}
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign up
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}