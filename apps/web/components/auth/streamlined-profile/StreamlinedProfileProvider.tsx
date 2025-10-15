'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'

type UserRole = 'CONTRIBUTOR' | 'TALENT' | 'BOTH'

interface StreamlinedProfileData {
  // Essential fields only
  primarySkill?: string
  availabilityStatus?: string
  city?: string
  country?: string
  bio?: string
  
  // Optional fields (can be filled later)
  instagramHandle?: string
  websiteUrl?: string
  phoneNumber?: string
  genderIdentity?: string
  ethnicity?: string
  nationality?: string
  experienceLevel?: string
  
  // Contributor fields (optional)
  yearsExperience?: number
  equipment?: string
  software?: string
  studio?: string
  
  // Talent fields (optional)
  height?: string
  weight?: string
  bodyType?: string
  tfpAcceptance?: string
  
  // Work preferences (optional)
  acceptsTfp?: boolean
  prefersStudio?: boolean
  prefersOutdoor?: boolean
  availableWeekdays?: boolean
  availableWeekends?: boolean
}

interface StreamlinedProfileContextType {
  // Step management (reduced to 3 steps)
  currentStep: 'role' | 'profile' | 'setup'
  setCurrentStep: (step: StreamlinedProfileContextType['currentStep']) => void
  
  // Role management
  selectedRole: UserRole | null
  setSelectedRole: (role: UserRole | null) => void
  
  // Essential form data only
  firstName: string
  setFirstName: (name: string) => void
  lastName: string
  setLastName: (name: string) => void
  displayName: string
  setDisplayName: (name: string) => void
  handle: string
  setHandle: (handle: string) => void
  
  // Profile data
  profileData: StreamlinedProfileData
  setProfileData: React.Dispatch<React.SetStateAction<StreamlinedProfileData>>
  
  // Profile photo
  selectedFile: File | null
  setSelectedFile: (file: File | null) => void
  avatarPreview: string
  setAvatarPreview: (preview: string) => void
  existingAvatarUrl: string
  setExistingAvatarUrl: (url: string) => void
  
  // Validation
  handleError: string
  setHandleError: (error: string) => void
  handleAvailable: boolean
  setHandleAvailable: (available: boolean) => void
  
  // Loading and error states
  loading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  
  // Actions
  handleRoleSelection: (role: UserRole) => void
  handleProfileSubmit: (e: React.FormEvent) => void
  handleFinalSubmit: () => Promise<void>
  checkExistingProfile: () => Promise<void>
}

const StreamlinedProfileContext = createContext<StreamlinedProfileContextType | undefined>(undefined)

export function StreamlinedProfileProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()
  
  // Step management (only 3 steps)
  const [currentStep, setCurrentStep] = useState<StreamlinedProfileContextType['currentStep']>('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Role management
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  
  // Essential form data only
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  
  // Streamlined profile data
  const [profileData, setProfileData] = useState<StreamlinedProfileData>({})
  
  // Profile photo
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [existingAvatarUrl, setExistingAvatarUrl] = useState('')
  
  // Validation
  const [handleError, setHandleError] = useState('')
  const [handleAvailable, setHandleAvailable] = useState(true)

  // Initialize data from signup or user metadata
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if there's stored data from signup
    const storedRole = sessionStorage.getItem('preset_signup_role') as UserRole | null
    const storedFirstName = sessionStorage.getItem('preset_signup_firstName')
    const storedLastName = sessionStorage.getItem('preset_signup_lastName')
    const storedCity = sessionStorage.getItem('preset_signup_city')
    const storedCountry = sessionStorage.getItem('preset_signup_country')

    if (storedRole && !selectedRole) {
      setSelectedRole(storedRole)
      setCurrentStep('profile')
      sessionStorage.removeItem('preset_signup_role')
    }

    // Pre-fill name fields from signup or user metadata
    const firstName = storedFirstName || user?.user_metadata?.first_name || ''
    const lastName = storedLastName || user?.user_metadata?.last_name || ''
    
    if (firstName || lastName) {
      if (firstName) setFirstName(firstName)
      if (lastName) setLastName(lastName)
      
      const fullName = `${firstName} ${lastName}`.trim()
      if (fullName && !displayName) {
        setDisplayName(fullName)
      }

      if (firstName && !handle) {
        const generatedHandle = `${firstName}${lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '')
        setHandle(generatedHandle)
      }
    }

    // Pre-fill location data from signup
    if (storedCity || storedCountry) {
      setProfileData(prev => ({
        ...prev,
        city: storedCity || prev.city,
        country: storedCountry || prev.country
      }))
    }

    // Clear stored names and location data
    if (storedFirstName) sessionStorage.removeItem('preset_signup_firstName')
    if (storedLastName) sessionStorage.removeItem('preset_signup_lastName')
    if (storedCity) sessionStorage.removeItem('preset_signup_city')
    if (storedCountry) sessionStorage.removeItem('preset_signup_country')

    // Check existing profile
    setTimeout(() => {
      checkExistingProfile()
    }, 100)
  }, [user, router])

  const checkExistingProfile = async () => {
    if (!user || !supabase) return
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      router.push('/auth/signin')
      return
    }
    
    try {
      const { data: profile, error } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          setError('Authentication error. Please sign in again.')
          router.push('/auth/signin')
          return
        }
        setError('Unable to check profile status. Please try again.')
        return
      }
      
      if (profile) {
        router.push('/dashboard')
        return
      }
    } catch (err) {
      console.error('Unexpected error checking for existing profile:', err)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role)
    setCurrentStep('profile')
    setError(null)
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!displayName.trim() || !handle.trim()) {
      setError('Display name and handle are required')
      return
    }

    if (handle.length < 3) {
      setError('Handle must be at least 3 characters')
      return
    }

    if (!/^[a-z][a-z0-9_]*$/.test(handle)) {
      setError('Handle must start with a letter and contain only lowercase letters, numbers, and underscores')
      return
    }

    if (!handleAvailable) {
      setError('Handle is not available')
      return
    }

    setCurrentStep('setup')
  }

  const handleFinalSubmit = async () => {
    if (!user || !selectedRole || !supabase) {
      setError('Missing required information. Please try again.')
      return
    }
    
    setLoading(true)
    setError(null)

    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      setLoading(false)
      return
    }

    if (!displayName.trim() || !handle.trim()) {
      setError('Display name and handle are required')
      setLoading(false)
      return
    }

    if (!profileData.primarySkill) {
      setError('Primary skill is required')
      setLoading(false)
      return
    }

    console.log('🚀 Starting profile creation with data:', {
      user: user.id,
      selectedRole,
      firstName,
      lastName,
      displayName,
      handle,
      profileData
    })

    try {
      // Prepare streamlined profile data
      const roleFlags = selectedRole === 'BOTH' 
        ? ['CONTRIBUTOR', 'TALENT'] 
        : [selectedRole]

      // Get date of birth from sessionStorage (from signup)
      const signupDob = sessionStorage.getItem('preset_signup_dob')
      let dateOfBirth = null
      if (signupDob) {
        // Convert ISO string to date format (YYYY-MM-DD)
        const dobDate = new Date(signupDob)
        dateOfBirth = dobDate.toISOString().split('T')[0]
      }

      const profileDataToSave = {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        handle: handle.toLowerCase(),
        bio: profileData.bio || null,
        city: profileData.city || null,
        country: profileData.country || 'Ireland',
        avatar_url: existingAvatarUrl,
        account_type: roleFlags,
        date_of_birth: dateOfBirth,
        
        // Essential fields only (matching database schema)
        availability_status: profileData.availabilityStatus || 'Available',
        
        // Primary skill - save to both fields for compatibility
        primary_skill: profileData.primarySkill || null,
        talent_categories: profileData.primarySkill ? [profileData.primarySkill] : [],
        
        // Optional fields (can be filled later) - using correct field names
        instagram_handle: profileData.instagramHandle || null,
        website_url: profileData.websiteUrl || null,
        phone_number: profileData.phoneNumber || null,
        gender_identity: profileData.genderIdentity || null,
        ethnicity: profileData.ethnicity || null,
        nationality: profileData.nationality || null,
        experience_level: profileData.experienceLevel || 'beginner',
        
        // Contributor fields (optional) - using correct field names
        years_experience: profileData.yearsExperience || 0,
        equipment_list: profileData.equipment ? [profileData.equipment] : [],
        editing_software: profileData.software ? [profileData.software] : [],
        studio_name: profileData.studio || null,
        
        // Talent fields (optional) - using correct field names
        height_cm: profileData.height ? parseInt(profileData.height.replace(/\D/g, '')) : null,
        weight_kg: profileData.weight ? parseInt(profileData.weight.replace(/\D/g, '')) : null,
        body_type: profileData.bodyType || null,
        
        // Work preferences
        accepts_tfp: profileData.acceptsTfp ?? false,
        prefers_studio: profileData.prefersStudio ?? false,
        prefers_outdoor: profileData.prefersOutdoor ?? false,
        available_weekdays: profileData.availableWeekdays ?? false,
        available_weekends: profileData.availableWeekends ?? false,
        
        // Default privacy settings
        show_age: true,
        show_location: true,
        show_physical_attributes: true,
        
        // Account status
        account_status: 'active',
        updated_at: new Date().toISOString()
      }

      // Check if user already has a profile
      const { data: existingProfile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let profileError = null

      console.log('📝 Profile data to save:', profileDataToSave)

      if (existingProfile) {
        const { error } = await supabase
          .from('users_profile')
          .update(profileDataToSave)
          .eq('user_id', user.id)
        profileError = error
      } else {
        const { error, data } = await supabase
          .from('users_profile')
          .insert({
            user_id: user.id,
            ...profileDataToSave,
            subscription_tier: 'FREE',
            subscription_status: 'ACTIVE',
            created_at: new Date().toISOString()
          })
          .select()
        profileError = error
        console.log('📝 Insert result:', { error, data })
      }

      if (profileError) {
        console.error('❌ Profile save error (object):', profileError)
        console.error('❌ Profile save error (JSON):', JSON.stringify(profileError, null, 2))
        console.error('❌ Error message:', profileError.message)
        console.error('❌ Error details:', profileError.details)
        console.error('❌ Error hint:', profileError.hint)
        console.error('❌ Error code:', profileError.code)

        // Try to extract meaningful error info
        let errorMsg = 'Unknown error'
        if (profileError.message) {
          errorMsg = profileError.message
        } else if (profileError.details) {
          errorMsg = profileError.details
        } else if (profileError.hint) {
          errorMsg = profileError.hint
        }

        // Handle specific error cases
        if (profileError.code === '23505') {
          errorMsg = 'A profile with this information already exists. Please check your details.'
        } else if (profileError.code === '23503') {
          errorMsg = 'Invalid user reference. Please sign out and sign in again.'
        } else if (profileError.message?.includes('handle')) {
          errorMsg = 'Handle is already taken. Please choose a different one.'
        } else if (profileError.message?.includes('email')) {
          errorMsg = 'Email address issue. Please check your account.'
        }

        setError(`Failed to save profile: ${errorMsg}`)
        setLoading(false)
        return
      }

      // Initialize user credits if this is a new profile
      if (!existingProfile) {
        try {
          const { data: existingCredits } = await supabase
            .from('user_credits')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (!existingCredits) {
            await supabase
              .from('user_credits')
              .insert({
                user_id: user.id,
                subscription_tier: 'FREE',
                monthly_allowance: 5,
                current_balance: 5,
                consumed_this_month: 0,
                lifetime_consumed: 0
              })

            await supabase
              .from('credit_transactions')
              .insert({
                user_id: user.id,
                transaction_type: 'allocation',
                credits_used: 5,
                enhancement_type: 'welcome_bonus',
                status: 'completed'
              })
          }
        } catch (creditsErr) {
          console.error('Credits initialization error:', creditsErr)
        }
      }

      // Success! Redirect to dashboard
      console.log('✅ Profile created successfully! Redirecting to dashboard...')
      router.push('/dashboard')
    } catch (err) {
      console.error('❌ Profile completion error:', err)
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      })
      
      let errorMessage = 'An unexpected error occurred. Please try again.'
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (err.message.includes('permission') || err.message.includes('unauthorized')) {
          errorMessage = 'Permission error. Please sign out and sign in again.'
        } else {
          errorMessage = `Error: ${err.message}`
        }
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  const value: StreamlinedProfileContextType = {
    currentStep,
    setCurrentStep,
    selectedRole,
    setSelectedRole,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    displayName,
    setDisplayName,
    handle,
    setHandle,
    profileData,
    setProfileData,
    selectedFile,
    setSelectedFile,
    avatarPreview,
    setAvatarPreview,
    existingAvatarUrl,
    setExistingAvatarUrl,
    handleError,
    setHandleError,
    handleAvailable,
    setHandleAvailable,
    loading,
    setLoading,
    error,
    setError,
    handleRoleSelection,
    handleProfileSubmit,
    handleFinalSubmit,
    checkExistingProfile
  }

  return (
    <StreamlinedProfileContext.Provider value={value}>
      {children}
    </StreamlinedProfileContext.Provider>
  )
}

export function useStreamlinedProfile() {
  const context = useContext(StreamlinedProfileContext)
  if (context === undefined) {
    throw new Error('useStreamlinedProfile must be used within a StreamlinedProfileProvider')
  }
  return context
}
