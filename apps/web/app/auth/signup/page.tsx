'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { uploadProfilePhoto } from '../../../lib/storage'
import { 
  Camera, 
  Users, 
  Check, 
  ChevronRight, 
  Mail, 
  Lock, 
  User,
  MapPin,
  Briefcase,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react'
import ProfileSetupForm from '../../../components/ProfileSetupForm'
import { DatePicker } from '../../../components/ui/date-picker'

type SignupStep = 'role' | 'credentials' | 'profile' | 'styles'
type UserRole = 'CONTRIBUTOR' | 'TALENT' | 'BOTH'

const STYLE_TAGS = [
  'Portrait', 'Fashion', 'Editorial', 'Commercial', 'Lifestyle',
  'Beauty', 'Street', 'Fine Art', 'Documentary', 'Product',
  'Food', 'Architecture', 'Nature', 'Wedding', 'Event',
  'Minimalist', 'Moody', 'Vintage', 'Modern', 'Candid'
]

const VIBES = [
  'Professional', 'Creative', 'Experimental', 'Classic',
  'Bold', 'Natural', 'Dramatic', 'Soft', 'Edgy', 'Timeless'
]

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<SignupStep>('role')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  
  // Additional profile fields
  const [profileData, setProfileData] = useState<any>({})
  
  // Age verification
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
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

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role)
    setCurrentStep('credentials')
    setError(null)
  }

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
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

    setCurrentStep('profile')
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!displayName.trim() || !handle.trim()) {
      setError('Display name and handle are required')
      return
    }

    if (handle.length < 3) {
      setError('Handle must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      setError('Handle can only contain letters, numbers, and underscores')
      return
    }

    setCurrentStep('styles')
  }

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style].slice(0, 5) // Max 5 styles
    )
  }

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe].slice(0, 3) // Max 3 vibes
    )
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Create auth account
      const { error: signUpError } = await signUp(email, password)
      
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Step 2: Get the newly created user
      if (!supabase) {
        setError('Database connection not available. Please try again.')
        setLoading(false)
        return
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Failed to create account. Please try again.')
        setLoading(false)
        return
      }

      // Step 3: Upload profile photo if provided
      let avatarUrl = null
      if (profileData.avatarFile) {
        console.log('Uploading profile photo...')
        avatarUrl = await uploadProfilePhoto(profileData.avatarFile, user.id)
        if (!avatarUrl) {
          console.warn('Failed to upload profile photo, continuing without it')
        }
      }

      // Step 4: Create user profile with enhanced fields
      const roleFlags = selectedRole === 'BOTH' 
        ? ['CONTRIBUTOR', 'TALENT'] 
        : [selectedRole!]

      const { error: profileError } = await supabase
        .from('users_profile')
        .insert({
          user_id: user.id,
          display_name: displayName,
          handle: handle.toLowerCase(),
          bio: bio || null,
          city: city || null,
          country: profileData.country || null,
          avatar_url: avatarUrl, // Use the uploaded photo URL
          date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
          age_verified: false, // Will be verified by admin
          account_status: 'pending_verification',
          role_flags: roleFlags,
          style_tags: selectedStyles,
          // Social media
          instagram_handle: profileData.instagramHandle || null,
          tiktok_handle: profileData.tiktokHandle || null,
          website_url: profileData.websiteUrl || null,
          portfolio_url: profileData.portfolioUrl || null,
          phone_number: profileData.phoneNumber || null,
          // Contributor-specific fields
          years_experience: profileData.yearsExperience || 0,
          specializations: profileData.specializations || [],
          equipment_list: profileData.equipment || [],
          editing_software: profileData.editingSoftware || [],
          languages: profileData.languages || [],
          hourly_rate_min: profileData.hourlyRateMin || null,
          hourly_rate_max: profileData.hourlyRateMax || null,
          available_for_travel: profileData.availableForTravel || false,
          travel_radius_km: profileData.travelRadius || 50,
          studio_name: profileData.studioName || null,
          has_studio: profileData.hasStudio || false,
          studio_address: profileData.studioAddress || null,
          typical_turnaround_days: profileData.typicalTurnaroundDays || null,
          // Talent-specific fields
          height_cm: profileData.heightCm || null,
          measurements: profileData.measurements || null,
          eye_color: profileData.eyeColor || null,
          hair_color: profileData.hairColor || null,
          shoe_size: profileData.shoeSize || null,
          clothing_sizes: profileData.clothingSizes || null,
          tattoos: profileData.tattoos || false,
          piercings: profileData.piercings || false,
          talent_categories: profileData.talentCategories || [],
          // Subscription
          subscription_tier: 'FREE',
          subscription_status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      // Trigger age verification
      if (dateOfBirth) {
        await supabase.rpc('verify_user_age', {
          p_user_id: user.id,
          p_date_of_birth: dateOfBirth.toISOString().split('T')[0],
          p_method: 'self_attestation'
        })
      }

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setError('Failed to create profile. Please try again.')
        setLoading(false)
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'role', label: 'Choose Role' },
      { key: 'credentials', label: 'Create Account' },
      { key: 'profile', label: 'Your Profile' },
      { key: 'styles', label: 'Your Style' }
    ]

    const currentIndex = steps.findIndex(s => s.key === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentIndex 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {index < currentIndex ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-emerald-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join Preset
          </h1>
          <p className="text-gray-600">
            Connect with creative professionals for amazing shoots
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          {/* Role Selection Step */}
          {currentStep === 'role' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  How will you use Preset?
                </h2>
                <p className="text-gray-600">
                  Choose your primary role (you can change this later)
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => handleRoleSelection('CONTRIBUTOR')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex items-start">
                    <Camera className="w-8 h-8 text-emerald-600 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        I'm a Contributor
                      </h3>
                      <p className="text-gray-600">
                        I'm a photographer, videographer, or cinematographer looking for talent for my shoots
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 ml-auto flex-shrink-0" />
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelection('TALENT')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex items-start">
                    <Users className="w-8 h-8 text-emerald-600 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        I'm Talent
                      </h3>
                      <p className="text-gray-600">
                        I'm a model, actor, or creative looking to collaborate on shoots
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 ml-auto flex-shrink-0" />
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelection('BOTH')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex items-start">
                    <Sparkles className="w-8 h-8 text-emerald-600 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        I do both
                      </h3>
                      <p className="text-gray-600">
                        I'm both a creative professional and talent
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 ml-auto flex-shrink-0" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Credentials Step */}
          {currentStep === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Create your account
                </h2>
                <p className="text-gray-600">
                  Enter your email and choose a secure password
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className={`pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 ${
                        password && !isPasswordValid ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a strong password"
                    />
                    {password && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isPasswordValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
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
                          'text-green-600'
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
                            'bg-green-500'
                          }`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Password requirements checklist */}
                  {(passwordFocused || password) && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div className={`flex items-center ${passwordValidations.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordValidations.minLength ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                        )}
                        At least 8 characters
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordValidations.hasUpperCase ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                        )}
                        One uppercase letter
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordValidations.hasLowerCase ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                        )}
                        One lowercase letter
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordValidations.hasNumber ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <div className="w-3 h-3 mr-1 border border-gray-300 rounded-full" />
                        )}
                        One number
                      </div>
                      <div className={`flex items-center ${passwordValidations.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
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
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      className={`pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 ${
                        confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Re-enter your password"
                    />
                    {confirmPassword && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {passwordsMatch ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p className="mt-1 text-xs text-green-600">Passwords match</p>
                  )}
                </div>
              </div>

              {/* Date of Birth Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  date={dateOfBirth}
                  onDateChange={setDateOfBirth}
                  placeholder="Select your birth date"
                  maxDate={new Date()}
                  className="w-full"
                />
                {dateOfBirth && (
                  <div className={`mt-2 text-sm ${isOver18 ? 'text-green-600' : 'text-red-600'}`}>
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
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('role')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Profile Step */}
          {currentStep === 'profile' && (
            <ProfileSetupForm
              role={selectedRole || 'BOTH'}
              currentData={{
                displayName,
                handle,
                bio,
                city,
                ...profileData
              }}
              onUpdate={(data) => {
                // Update basic fields
                if (data.displayName !== undefined) setDisplayName(data.displayName)
                if (data.handle !== undefined) setHandle(data.handle)
                if (data.bio !== undefined) setBio(data.bio)
                if (data.city !== undefined) setCity(data.city)
                
                // Store all additional fields
                setProfileData(data)
              }}
              onNext={() => setCurrentStep('styles')}
              onBack={() => setCurrentStep('credentials')}
            />
          )}

          {/* Styles Step */}
          {currentStep === 'styles' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Define your style
                </h2>
                <p className="text-gray-600">
                  Choose tags that best describe your creative style
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Style tags (select up to 5)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TAGS.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedStyles.includes(style)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Your vibe (select up to 3)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map((vibe) => (
                    <button
                      key={vibe}
                      type="button"
                      onClick={() => toggleVibe(vibe)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedVibes.includes(vibe)
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('profile')}
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Complete signup'}
                </button>
              </div>

              <p className="text-xs text-center text-gray-500">
                You can always update these preferences later in your settings
              </p>
            </div>
          )}
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <span className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}