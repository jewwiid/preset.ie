'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'

type UserRole = 'CONTRIBUTOR' | 'TALENT' | 'BOTH'

interface ProfileData {
  // Primary skill (REQUIRED)
  primarySkill?: string

  // Social media & contact
  instagramHandle?: string
  tiktokHandle?: string
  websiteUrl?: string
  portfolioUrl?: string
  phoneNumber?: string

  // Age & verification
  dateOfBirth?: string

  // Enhanced demographics
  genderIdentity?: string
  ethnicity?: string
  nationality?: string
  weightKg?: number | null
  bodyType?: string
  hairLength?: string
  skinTone?: string
  experienceLevel?: string
  stateProvince?: string
  timezone?: string
  
  // Contributor fields
  yearsExperience?: number
  professionalSkills?: string[]      // NEW: Services they provide
  contributorRoles?: string[]
  equipment?: string
  software?: string
  studio?: string
  editingSoftware?: string[]
  languages?: string[]
  hourlyRateMin?: number | null
  hourlyRateMax?: number | null
  availableForTravel?: boolean
  travelRadius?: number
  studioName?: string
  hasStudio?: boolean
  studioAddress?: string
  typicalTurnaroundDays?: number | null
  
  // Talent fields
  height?: string
  weight?: string
  heightCm?: number | null
  measurements?: string
  eyeColor?: string
  hairColor?: string
  shoeSize?: string
  clothingSizes?: string
  tattoos?: boolean
  piercings?: boolean
  tfpAcceptance?: string
  preferredWorkTypes?: string[]
  performanceRoles?: string[]        // NEW: What they perform as
  
  // Work preferences
  availabilityStatus?: string
  preferredWorkingHours?: string
  acceptsTfp?: boolean
  acceptsExpensesOnly?: boolean
  prefersStudio?: boolean
  prefersOutdoor?: boolean
  availableWeekdays?: boolean
  availableWeekends?: boolean
  worksWithTeams?: boolean
  prefersSoloWork?: boolean
  
  // Content preferences
  comfortableWithNudity?: boolean
  comfortableWithIntimateContent?: boolean
  requiresModelRelease?: boolean
  
  // Privacy settings
  showAge?: boolean
  showLocation?: boolean
  showPhysicalAttributes?: boolean
  
  // Travel & documentation
  passportValid?: boolean
}

interface CompleteProfileContextType {
  // Step management
  currentStep: 'role' | 'profile' | 'demographics' | 'details' | 'equipment' | 'physical' | 'categories' | 'preferences' | 'privacy' | 'styles'
  setCurrentStep: (step: CompleteProfileContextType['currentStep']) => void
  
  // Role management
  selectedRole: UserRole | null
  setSelectedRole: (role: UserRole | null) => void
  
  // Basic form data
  firstName: string
  setFirstName: (name: string) => void
  lastName: string
  setLastName: (name: string) => void
  email: string
  setEmail: (email: string) => void
  dateOfBirth: Date | null
  setDateOfBirth: (date: Date | null) => void
  displayName: string
  setDisplayName: (name: string) => void
  handle: string
  setHandle: (handle: string) => void
  bio: string
  setBio: (bio: string) => void
  city: string
  setCity: (city: string) => void
  country: string
  setCountry: (country: string) => void
  
  // Profile data
  profileData: ProfileData
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>
  
  // Style tags
  selectedStyles: string[]
  setSelectedStyles: React.Dispatch<React.SetStateAction<string[]>>
  selectedVibes: string[]
  setSelectedVibes: React.Dispatch<React.SetStateAction<string[]>>
  
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
  selectedCountryCode: string
  setSelectedCountryCode: (code: string) => void
  phoneValidation: { isValid: boolean; error: string | null }
  setPhoneValidation: (validation: { isValid: boolean; error: string | null }) => void
  
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

const CompleteProfileContext = createContext<CompleteProfileContextType | undefined>(undefined)

export function CompleteProfileProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()
  
  // Step management
  const [currentStep, setCurrentStep] = useState<CompleteProfileContextType['currentStep']>('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Role management
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  
  // Basic form data
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Ireland')
  
  // Profile data
  const [profileData, setProfileData] = useState<ProfileData>()
  
  // Style tags
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  
  // Profile photo
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [existingAvatarUrl, setExistingAvatarUrl] = useState('')
  
  // Validation
  const [handleError, setHandleError] = useState('')
  const [handleAvailable, setHandleAvailable] = useState(true)
  const [selectedCountryCode, setSelectedCountryCode] = useState('+353')
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error: string | null }>({ isValid: true, error: null })

  // Initialize data from signup or user metadata
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if there's stored data from signup
    const storedRole = sessionStorage.getItem('preset_signup_role') as UserRole | null
    const storedDob = sessionStorage.getItem('preset_signup_dob')
    const storedEmail = sessionStorage.getItem('preset_signup_email')
    const storedFirstName = sessionStorage.getItem('preset_signup_firstName')
    const storedLastName = sessionStorage.getItem('preset_signup_lastName')

    if (storedRole && !selectedRole) {
      setSelectedRole(storedRole)
      setCurrentStep('profile')
      sessionStorage.removeItem('preset_signup_role')
    }

    if (storedDob && !profileData.dateOfBirth) {
      setProfileData(prev => ({ ...prev, dateOfBirth: storedDob.split('T')[0] }))
      sessionStorage.removeItem('preset_signup_dob')
    } else if (!profileData.dateOfBirth && user?.user_metadata?.date_of_birth) {
      setProfileData(prev => ({ ...prev, dateOfBirth: user.user_metadata.date_of_birth }))
    }

    if (storedEmail && user.email) {
      setProfileData(prev => ({ ...prev, email: user.email }))
      sessionStorage.removeItem('preset_signup_email')
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

    // Clear stored names
    if (storedFirstName) sessionStorage.removeItem('preset_signup_firstName')
    if (storedLastName) sessionStorage.removeItem('preset_signup_lastName')

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
        .select('*')
        .eq('user_id', user.id)
        .single()
      
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

    setCurrentStep('demographics')
  }

  const handleFinalSubmit = async () => {
    if (!user || !selectedRole || !supabase) return
    
    setLoading(true)
    setError(null)

    try {
      // Prepare profile data
      const roleFlags = selectedRole === 'BOTH' 
        ? ['CONTRIBUTOR', 'TALENT'] 
        : [selectedRole]

      const profileDataToSave = {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        handle: handle.toLowerCase(),
        bio: bio || null,
        city: city || null,
        country: country || null,
        avatar_url: existingAvatarUrl,
        account_type: roleFlags,
        style_tags: selectedStyles,
        vibe_tags: selectedVibes,
        primary_skill: profileData.primarySkill || null,
        instagram_handle: profileData.instagramHandle || null,
        tiktok_handle: profileData.tiktokHandle || null,
        website_url: profileData.websiteUrl || null,
        portfolio_url: profileData.portfolioUrl || null,
        phone_number: profileData.phoneNumber || null,
        email: user?.email || null,
        date_of_birth: profileData.dateOfBirth || null,
        gender_identity: profileData.genderIdentity || null,
        ethnicity: profileData.ethnicity || null,
        nationality: profileData.nationality || null,
        weight_kg: profileData.weightKg || null,
        body_type: profileData.bodyType || null,
        hair_length: profileData.hairLength || null,
        skin_tone: profileData.skinTone || null,
        experience_level: profileData.experienceLevel || null,
        state_province: profileData.stateProvince || null,
        timezone: profileData.timezone || null,
        years_experience: profileData.yearsExperience || 0,
        professional_skills: profileData.professionalSkills || [],
        contributor_roles: profileData.contributorRoles || [],
        equipment_list: profileData.equipment || null,
        software_list: profileData.software || null,
        studio_name: profileData.studio || null,
        editing_software: profileData.editingSoftware || [],
        languages: profileData.languages || [],
        hourly_rate_min: profileData.hourlyRateMin || null,
        hourly_rate_max: profileData.hourlyRateMax || null,
        available_for_travel: profileData.availableForTravel || false,
        travel_radius_km: profileData.travelRadius || 50,
        has_studio: profileData.hasStudio || false,
        studio_address: profileData.studioAddress || null,
        typical_turnaround_days: profileData.typicalTurnaroundDays || null,
        height: profileData.height || null,
        weight: profileData.weight || null,
        height_cm: profileData.heightCm || null,
        measurements: profileData.measurements || null,
        eye_color: profileData.eyeColor || null,
        hair_color: profileData.hairColor || null,
        shoe_size: profileData.shoeSize || null,
        clothing_sizes: profileData.clothingSizes || null,
        tattoos: profileData.tattoos || false,
        piercings: profileData.piercings || false,
        tfp_acceptance: profileData.tfpAcceptance || null,
        preferred_work_types: profileData.preferredWorkTypes || [],
        talent_categoriess: profileData.performanceRoles || [],
        availability_status: profileData.availabilityStatus || null,
        preferred_working_hours: profileData.preferredWorkingHours || null,
        accepts_tfp: profileData.acceptsTfp || false,
        accepts_expenses_only: profileData.acceptsExpensesOnly || false,
        prefers_studio: profileData.prefersStudio || false,
        prefers_outdoor: profileData.prefersOutdoor || false,
        available_weekdays: profileData.availableWeekdays || false,
        available_weekends: profileData.availableWeekends || false,
        works_with_teams: profileData.worksWithTeams || false,
        prefers_solo_work: profileData.prefersSoloWork || false,
        comfortable_with_nudity: profileData.comfortableWithNudity || false,
        comfortable_with_intimate_content: profileData.comfortableWithIntimateContent || false,
        requires_model_release: profileData.requiresModelRelease || false,
        show_age: profileData.showAge || true,
        show_location: profileData.showLocation || true,
        show_physical_attributes: profileData.showPhysicalAttributes || true,
        passport_valid: profileData.passportValid || false,
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

      if (existingProfile) {
        const { error } = await supabase
          .from('users_profile')
          .update(profileDataToSave)
          .eq('user_id', user.id)
        profileError = error
      } else {
        const { error } = await supabase
          .from('users_profile')
          .insert({
            user_id: user.id,
            ...profileDataToSave,
            subscription_tier: 'FREE',
            subscription_status: 'ACTIVE',
            created_at: new Date().toISOString()
          })
        profileError = error
      }

      if (profileError) {
        console.error('Profile save error:', profileError)
        setError('Failed to save profile. Please try again.')
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

      router.push('/dashboard')
    } catch (err) {
      console.error('Profile completion error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const value: CompleteProfileContextType = {
    currentStep,
    setCurrentStep,
    selectedRole,
    setSelectedRole,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    dateOfBirth,
    setDateOfBirth,
    displayName,
    setDisplayName,
    handle,
    setHandle,
    bio,
    setBio,
    city,
    setCity,
    country,
    setCountry,
    profileData,
    setProfileData,
    selectedStyles,
    setSelectedStyles,
    selectedVibes,
    setSelectedVibes,
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
    selectedCountryCode,
    setSelectedCountryCode,
    phoneValidation,
    setPhoneValidation,
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
    <CompleteProfileContext.Provider value={value}>
      {children}
    </CompleteProfileContext.Provider>
  )
}

export function useCompleteProfile() {
  const context = useContext(CompleteProfileContext)
  if (context === undefined) {
    throw new Error('useCompleteProfile must be used within a CompleteProfileProvider')
  }
  return context
}
