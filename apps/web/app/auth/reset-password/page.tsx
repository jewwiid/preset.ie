'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Camera,
  ArrowRight
} from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Password validation state
  const [passwordFocused, setPasswordFocused] = useState(false)
  
  // Password validation checks
  const passwordValidations = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const isPasswordValid = passwordValidations.minLength && 
                          passwordValidations.hasUpperCase && 
                          passwordValidations.hasLowerCase && 
                          passwordValidations.hasNumber

  const passwordsMatch = password === confirmPassword && password.length > 0

  // Calculate password strength
  const getPasswordStrength = () => {
    let strength = 0
    if (passwordValidations.minLength) strength++
    if (passwordValidations.hasUpperCase) strength++
    if (passwordValidations.hasLowerCase) strength++
    if (passwordValidations.hasNumber) strength++
    if (passwordValidations.hasSpecialChar) strength++
    
    if (strength <= 2) return { level: 'Weak', color: 'red', width: '33%' }
    if (strength <= 3) return { level: 'Fair', color: 'yellow', width: '50%' }
    if (strength <= 4) return { level: 'Good', color: 'blue', width: '75%' }
    return { level: 'Strong', color: 'green', width: '100%' }
  }

  const passwordStrength = getPasswordStrength()

  useEffect(() => {
    // Check if we have a valid session/token for password reset
    const checkResetToken = async () => {
      if (!supabase) {
        setError('Authentication service not available')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }
    checkResetToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!isPasswordValid) {
      setError('Password must meet all requirements')
      setLoading(false)
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      if (!supabase) {
        setError('Authentication service not available')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect to sign in page after successful reset
        setTimeout(() => {
          router.push('/auth/signin?reset=true')
        }, 2000)
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-primary/10 via-white to-secondary-primary/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-primary to-secondary-primary rounded-full mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reset your password
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-primary-50 border border-primary/20 text-primary-700 px-4 py-3 rounded-lg flex items-start">
            <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Password reset successfully! Redirecting to sign in...</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`pl-10 pr-10 w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary bg-white text-gray-900 transition-all ${
                    password && !isPasswordValid ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'red' ? 'text-red-600' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                      passwordStrength.color === 'blue' ? 'text-blue-600' :
                      'text-primary-600'
                    }`}>
                      {passwordStrength.level}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.color === 'red' ? 'bg-red-500' :
                        passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                        passwordStrength.color === 'blue' ? 'bg-blue-500' :
                        'bg-primary-500'
                      }`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}
              
              {/* Password requirements checklist */}
              {(passwordFocused || password) && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className={`flex items-center ${passwordValidations.minLength ? 'text-primary-600' : 'text-gray-400'}`}>
                    {passwordValidations.minLength ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                    )}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${passwordValidations.hasUpperCase ? 'text-primary-600' : 'text-gray-400'}`}>
                    {passwordValidations.hasUpperCase ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                    )}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center ${passwordValidations.hasLowerCase ? 'text-primary-600' : 'text-gray-400'}`}>
                    {passwordValidations.hasLowerCase ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                    )}
                    One lowercase letter
                  </div>
                  <div className={`flex items-center ${passwordValidations.hasNumber ? 'text-primary-600' : 'text-gray-400'}`}>
                    {passwordValidations.hasNumber ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                    )}
                    One number
                  </div>
                  <div className={`flex items-center ${passwordValidations.hasSpecialChar ? 'text-primary-600' : 'text-gray-400'}`}>
                    {passwordValidations.hasSpecialChar ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                    )}
                    One special character (optional but recommended)
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary bg-white text-gray-900 transition-all ${
                    confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="mt-1 text-xs text-primary-600">Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-primary to-secondary-primary hover:from-primary-primary/90 hover:to-secondary-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting password...
                </div>
              ) : (
                <div className="flex items-center">
                  Reset password
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}