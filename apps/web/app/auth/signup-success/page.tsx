'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

function SignupSuccessContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // If no email in URL, redirect to signup
      router.push('/auth/signup')
    }
  }, [searchParams, router])

  const handleResendEmail = async () => {
    if (!email) return
    
    setResending(true)
    setError(null)

    try {
      if (!supabase) {
        setError('Authentication service not available')
        return
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setError(error.message)
      } else {
        // Show success message briefly
        setError(null)
        setTimeout(() => {
          setError(null)
        }, 3000)
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const handleCheckEmail = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!supabase) {
        setError('Authentication service not available')
        return
      }
      
      // Check if user has confirmed their email
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // User is confirmed, redirect to profile completion
        router.push('/auth/complete-profile')
      } else {
        setError('Email not confirmed yet. Please check your inbox and click the confirmation link.')
      }
    } catch (err) {
      setError('Failed to check email status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Check your email
          </h1>
          <p className="mt-2 text-gray-600">
            We've sent a confirmation link to your email address
          </p>
        </div>

        {/* Email Display */}
        {email && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium">{email}</span>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Almost there!
              </h2>
              <p className="text-gray-600 text-sm">
                Click the link in your email to confirm your account, then you can complete your profile.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCheckEmail}
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  <div className="flex items-center">
                    I've confirmed my email
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                )}
              </button>

              <button
                onClick={handleResendEmail}
                disabled={resending || !email}
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {resending ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Resending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Resend confirmation email
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={handleResendEmail}
              disabled={resending || !email}
              className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50"
            >
              resend it
            </button>
          </p>
        </div>

        {/* Back to Sign In */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/auth/signin')}
            className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupSuccessContent />
    </Suspense>
  )
}