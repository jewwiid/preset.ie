'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../lib/auth-context'
import { 
  Check, 
  ChevronRight, 
  Mail, 
  Lock, 
  AlertCircle,
  X,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react'
import { DatePicker } from '../../../components/ui/date-picker'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Checkbox } from '../../../components/ui/checkbox'
import { GoogleSignInButton } from '../../../components/auth/GoogleSignInButton'
import { RoleIndicator } from '../../../components/auth/RoleIndicator'

type SignupStep = 'role' | 'credentials'
type UserRole = 'CONTRIBUTOR' | 'TALENT' | 'BOTH'
type SignupMethod = 'email' | 'google'


export default function SignUpPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle } = useAuth()
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<SignupStep>('role')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [selectedSignupMethod, setSelectedSignupMethod] = useState<SignupMethod | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Age verification
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Calculate age from date of birth
  const calculateAge = (dob: Date | undefined): number => {
    if (!dob) return 0
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }
  
  const userAge = calculateAge(dateOfBirth)
  const isOver18 = userAge >= 18
  
  // Password validation state
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)

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

  const handleRoleSelection = (role: UserRole, method: SignupMethod) => {
    setSelectedRole(role)
    setSelectedSignupMethod(method)
    setCurrentStep('credentials')
    setError(null)
  }

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Handle Google signup
    if (selectedSignupMethod === 'google') {
      handleGoogleSignup()
      return
    }

    // Email signup validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      return
    }

    if (!isPasswordValid) {
      setError('Password must meet all requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    if (!dateOfBirth) {
      setError('Please enter your date of birth')
      return
    }
    if (!isOver18) {
      setError('You must be 18 or older to use Preset')
      return
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    // Submit the email signup
    handleFinalSubmit()
  }

  const handleGoogleSignup = async () => {
    if (!selectedRole) return

    setLoading(true)
    setError(null)

    try {
      // Store the selected role and date of birth for the OAuth callback
      sessionStorage.setItem('preset_signup_role', selectedRole)
      if (dateOfBirth) {
        sessionStorage.setItem('preset_signup_dob', dateOfBirth.toISOString())
      }
      if (email) {
        sessionStorage.setItem('preset_signup_email', email)
      }

      // Initiate Google OAuth
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message)
        setLoading(false)
      }
      // If successful, user will be redirected to OAuth flow
    } catch (err) {
      setError('Failed to sign up with Google. Please try again.')
      setLoading(false)
    }
  }


  const handleFinalSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Store the selected role, date of birth, and name for the complete-profile step
      if (selectedRole) {
        sessionStorage.setItem('preset_signup_role', selectedRole)
      }
      if (dateOfBirth) {
        sessionStorage.setItem('preset_signup_dob', dateOfBirth.toISOString())
      }
      if (email) {
        sessionStorage.setItem('preset_signup_email', email)
      }
      if (firstName) {
        sessionStorage.setItem('preset_signup_firstName', firstName)
      }
      if (lastName) {
        sessionStorage.setItem('preset_signup_lastName', lastName)
      }

      // Create auth account with user metadata
      const { error: signUpError, needsEmailConfirmation } = await signUp(email, password, {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim()
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (needsEmailConfirmation) {
        // Redirect to email confirmation page
        router.push(`/auth/signup-success?email=${encodeURIComponent(email)}`)
      } else {
        // User is already confirmed, redirect to profile completion
        router.push('/auth/complete-profile')
      }
    } catch (err) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Signup error:', err)
      }
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'role', label: 'Choose Role' },
      { key: 'credentials', label: 'Create Account' }
    ]

    const currentIndex = steps.findIndex(s => s.key === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentIndex 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'bg-background border-border text-muted-foreground'
            }`}>
              {index < currentIndex ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-primary' : 'bg-border'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Join Preset
          </h1>
          <p className="text-muted-foreground">
            Connect with creative professionals for amazing shoots
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
          {/* Role Selection Step */}
          {currentStep === 'role' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  How will you use Preset?
                </h2>
                <p className="text-muted-foreground mb-2">
                  Choose your primary role (you can change this later)
                </p>
                <p className="text-xs text-muted-foreground">
                  Click any card to continue with email, or use the Google button for quick signup
                </p>
              </div>

              <div className="grid gap-4">
                {/* Contributor Role */}
                <div className="group">
                  <div className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                       onClick={() => handleRoleSelection('CONTRIBUTOR', 'email')}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          I'm a Contributor
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          I'm a photographer, videographer, or cinematographer looking for talent for my shoots
                        </p>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRoleSelection('CONTRIBUTOR', 'google')
                            }}
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google
                          </Button>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary ml-4 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Talent Role */}
                <div className="group">
                  <div className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                       onClick={() => handleRoleSelection('TALENT', 'email')}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          I'm Talent
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          I'm a model, actor, or creative looking to collaborate on shoots
                        </p>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRoleSelection('TALENT', 'google')
                            }}
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google
                          </Button>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary ml-4 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Both Role */}
                <div className="group">
                  <div className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                       onClick={() => handleRoleSelection('BOTH', 'email')}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          I do both
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          I'm both a creative professional and talent
                        </p>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRoleSelection('BOTH', 'google')
                            }}
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google
                          </Button>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary ml-4 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credentials Step */}
          {currentStep === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {selectedSignupMethod === 'google' ? 'Complete your Google signup' : 'Create your account'}
                </h2>
                <p className="text-muted-foreground">
                  {selectedSignupMethod === 'google' 
                    ? 'Click the button below to sign up with Google' 
                    : 'Enter your email and choose a secure password'
                  }
                </p>
                {selectedRole && (
                  <div className="mt-4">
                    <RoleIndicator role={selectedRole} />
                  </div>
                )}
              </div>

              {/* Google Signup Button */}
              {selectedSignupMethod === 'google' && (
                <div className="py-8">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 text-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                        Signing up with Google...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                      </>
                    )}
                  </Button>
                  
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('role')}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ← Back to role selection
                    </button>
                  </div>
                </div>
              )}

              {/* Email Signup Form */}
              {selectedSignupMethod === 'email' && (
                <>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-muted-foreground-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className={`pl-10 pr-20 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-muted-foreground-900 ${
                        password && !isPasswordValid ? 'border-destructive-300' : 'border-border-300'
                      }`}
                      placeholder="Create a strong password"
                    />
                    {password && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        {isPasswordValid ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <X className="w-5 h-5 text-destructive-500" />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground-400 hover:text-muted-foreground-600 focus:outline-none focus:text-muted-foreground-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
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
                        <span className="text-xs text-muted-foreground-600">Password strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.color === 'red' ? 'text-destructive-600' :
                          passwordStrength.color === 'yellow' ? 'text-primary-600' :
                          passwordStrength.color === 'blue' ? 'text-primary-600' :
                          'text-primary'
                        }`}>
                          {passwordStrength.level}
                        </span>
                      </div>
                      <div className="w-full bg-muted-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.color === 'red' ? 'bg-destructive-500' :
                            passwordStrength.color === 'yellow' ? 'bg-primary-500' :
                            passwordStrength.color === 'blue' ? 'bg-primary-500' :
                            'bg-primary'
                          }`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Password requirements checklist */}
                  {(passwordFocused || password) && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div className={`flex items-center ${passwordValidations.minLength ? 'text-primary' : 'text-muted-foreground-400'}`}>
                        {passwordValidations.minLength ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-border-300 rounded-full" />
                        )}
                        At least 8 characters
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasUpperCase ? 'text-primary' : 'text-muted-foreground-400'}`}>
                        {passwordValidations.hasUpperCase ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-border-300 rounded-full" />
                        )}
                        One uppercase letter
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasLowerCase ? 'text-primary' : 'text-muted-foreground-400'}`}>
                        {passwordValidations.hasLowerCase ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-border-300 rounded-full" />
                        )}
                        One lowercase letter
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasNumber ? 'text-primary' : 'text-muted-foreground-400'}`}>
                        {passwordValidations.hasNumber ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-border-300 rounded-full" />
                        )}
                        One number
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasSpecialChar ? 'text-primary' : 'text-muted-foreground-400'}`}>
                        {passwordValidations.hasSpecialChar ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-border-300 rounded-full" />
                        )}
                        One special character (optional but recommended)
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground-700 mb-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      className={`pl-10 pr-20 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-muted-foreground-900 ${
                        confirmPassword && !passwordsMatch ? 'border-destructive-300' : 'border-border-300'
                      }`}
                      placeholder="Re-enter your password"
                    />
                    {confirmPassword && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        {passwordsMatch ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <X className="w-5 h-5 text-destructive-500" />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground-400 hover:text-muted-foreground-600 focus:outline-none focus:text-muted-foreground-600"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="mt-1 text-xs text-destructive-600">Passwords do not match</p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p className="mt-1 text-xs text-primary">Passwords match</p>
                  )}
                </div>
              </div>

              {/* Date of Birth Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                  Date of Birth <span className="text-destructive-500">*</span>
                </label>
                <DatePicker
                  date={dateOfBirth}
                  onDateChange={setDateOfBirth}
                  placeholder="Select your birth date"
                  maxDate={new Date()}
                  className="w-full"
                />
                {dateOfBirth && (
                  <div className={`mt-2 text-sm ${isOver18 ? 'text-primary' : 'text-destructive-600'}`}>
                    {isOver18 ? (
                      <span className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        You are {userAge} years old - eligible to join
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        You must be 18 or older to use Preset (you are {userAge})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t pt-4">

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-300 rounded"
                  />
                  <span className="ml-2 text-sm text-muted-foreground-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:text-primary/80">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary/80">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('role')}
                      disabled={loading}
                      className="flex-1 py-2 px-4 border border-border-300 rounded-lg text-muted-foreground-700 hover:bg-muted-50 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loading ? 'Creating account...' : 'Create account'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          </CardContent>
        </Card>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <span className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}