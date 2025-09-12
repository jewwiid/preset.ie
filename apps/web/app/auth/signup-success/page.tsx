'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react'
import { resendConfirmationEmail } from '../../../lib/auth-utils'

export default function SignupSuccessPage() {
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Get email from localStorage if it was saved during signup
    const savedEmail = localStorage.getItem('signup-email')
    if (savedEmail) {
      setEmail(savedEmail)
      localStorage.removeItem('signup-email') // Clean up
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-6">
          <Mail className="w-8 h-8 text-emerald-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check Your Email
        </h1>
        
        <p className="text-gray-600 mb-6">
          We've sent a confirmation link to{' '}
          {email && (
            <span className="font-medium text-gray-900">{email}</span>
          )}
          {!email && 'your email address'}.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-emerald-800">
              <p className="font-medium mb-1">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Check your email inbox</li>
                <li>Click the confirmation link</li>
                <li>Complete your profile setup</li>
                <li>Start connecting with creatives!</li>
              </ol>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Didn't receive the email? Check your spam folder or try signing up again.
        </p>

        <div className="space-y-4">
          {/* Resend Email Button - Primary action */}
          <button
            onClick={async () => {
              if (!email) {
                setResendMessage('No email address found. Please try signing up again.')
                return
              }
              
              setResending(true)
              setResendMessage('')
              
              const result = await resendConfirmationEmail(email)
              
              if (result.success) {
                setResendMessage('✅ Confirmation email sent! Check your inbox.')
              } else {
                setResendMessage(`❌ ${result.error || 'Failed to send email. Please try again.'}`)
              }
              
              setResending(false)
            }}
            disabled={resending || !email}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? 'Sending...' : 'Resend Confirmation Email'}
          </button>
          
          {/* Resend Message */}
          {resendMessage && (
            <div className={`text-sm p-3 rounded-lg ${
              resendMessage.includes('✅') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {resendMessage}
            </div>
          )}
          
          {/* Secondary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => {
                // Clear any saved signup data for fresh start
                localStorage.removeItem('preset_signup_form_data')
                localStorage.removeItem('signup-email')
                router.push('/auth/signup')
              }}
              className="w-full py-2 px-4 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Different Email?
            </button>
            
            <Link
              href="/auth/signin"
              className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Already Confirmed?
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          
          {/* Help Text */}
          <div className="text-center text-sm text-gray-500 mt-6">
            <p>Still having trouble?</p>
            <button
              onClick={() => {
                // Clear saved data and start fresh
                localStorage.clear()
                router.push('/auth/signup')
              }}
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              Start completely fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
