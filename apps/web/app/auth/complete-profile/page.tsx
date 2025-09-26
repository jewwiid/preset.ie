'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { usePredefinedOptions, getOptionNames } from '../../../lib/hooks/use-predefined-options'
import { 
  Camera, 
  Users, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  MapPin,
  Globe,
  Instagram,
  Music2,
  Link,
  Phone,
  Briefcase,
  Ruler,
  Eye,
  Scissors,
  Building,
  Calendar,
  DollarSign,
  Plane,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Shield,
  Clock,
  Settings
} from 'lucide-react'

type UserRole = 'CONTRIBUTOR' | 'TALENT' | 'BOTH'

// Style tags and vibes will be fetched from database

const COUNTRIES = [
  'Ireland', 'United Kingdom', 'United States', 'Canada', 'Australia',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium',
  'Sweden', 'Denmark', 'Norway', 'Poland', 'Other'
]

// Equipment options will be fetched from database
const SOFTWARE_OPTIONS = [
  'Lightroom', 'Photoshop', 'Capture One', 'DaVinci Resolve',
  'Final Cut Pro', 'Premiere Pro', 'After Effects'
]

const TALENT_CATEGORIES = [
  'Model', 'Actor', 'Dancer', 'Musician', 'Artist', 'Influencer'
]

// All predefined options will be fetched from database

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { options: predefinedOptions, loading: optionsLoading, error: optionsError } = usePredefinedOptions()
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<'role' | 'profile' | 'demographics' | 'details' | 'preferences' | 'privacy' | 'styles'>('role')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Ireland')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  
  // Additional profile fields
  const [profileData, setProfileData] = useState<{
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
    specializations?: string[]
    equipment?: string[]
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
    heightCm?: number | null
    measurements?: string
    eyeColor?: string
    hairColor?: string
    shoeSize?: string
    clothingSizes?: string
    tattoos?: boolean
    piercings?: boolean
    talentCategories?: string[]
    
    // Work preferences
    availabilityStatus?: string
    preferredWorkingHours?: string
    acceptsTfp?: boolean
    acceptsExpensesOnly?: boolean
    prefersStudio?: boolean
    prefersOutdoor?: boolean
    availableWeekdays?: boolean
    availableWeekends?: boolean
    availableEvenings?: boolean
    availableOvernight?: boolean
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
  }>({})
  
  // Profile photo
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  
  // Handle validation
  const [handleError, setHandleError] = useState('')
  const [handleAvailable, setHandleAvailable] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/signin')
      return
    }
    
    // Check if user already has a profile
    checkExistingProfile()
  }, [user, router])

  const checkExistingProfile = async () => {
    if (!user || !supabase) return
    
    try {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (profile) {
        // User has a profile, populate form with existing data
        setDisplayName(profile.display_name || '')
        setHandle(profile.handle || '')
        setBio(profile.bio || '')
        setCity(profile.city || '')
        setCountry(profile.country || 'Ireland')
        setSelectedStyles(profile.style_tags || [])
        setSelectedVibes(profile.vibe_tags || [])
        
        // Set role from existing profile
        if (profile.role_flags && profile.role_flags.length > 0) {
          if (profile.role_flags.includes('CONTRIBUTOR') && profile.role_flags.includes('TALENT')) {
            setSelectedRole('BOTH')
          } else if (profile.role_flags.includes('CONTRIBUTOR')) {
            setSelectedRole('CONTRIBUTOR')
          } else if (profile.role_flags.includes('TALENT')) {
            setSelectedRole('TALENT')
          }
        }
        
        // Populate additional profile data
        setProfileData({
          // Social media & contact
          instagramHandle: profile.instagram_handle || '',
          tiktokHandle: profile.tiktok_handle || '',
          websiteUrl: profile.website_url || '',
          portfolioUrl: profile.portfolio_url || '',
          phoneNumber: profile.phone_number || '',
          
          // Age & verification
          dateOfBirth: profile.date_of_birth || '',
          
          // Enhanced demographics
          genderIdentity: profile.gender_identity || '',
          ethnicity: profile.ethnicity || '',
          nationality: profile.nationality || '',
          weightKg: profile.weight_kg || null,
          bodyType: profile.body_type || '',
          hairLength: profile.hair_length || '',
          skinTone: profile.skin_tone || '',
          experienceLevel: profile.experience_level || '',
          stateProvince: profile.state_province || '',
          timezone: profile.timezone || '',
          
          // Contributor fields
          yearsExperience: profile.years_experience || 0,
          specializations: profile.specializations || [],
          equipment: profile.equipment_list || [],
          editingSoftware: profile.editing_software || [],
          languages: profile.languages || [],
          hourlyRateMin: profile.hourly_rate_min || null,
          hourlyRateMax: profile.hourly_rate_max || null,
          availableForTravel: profile.available_for_travel || false,
          travelRadius: profile.travel_radius_km || 50,
          studioName: profile.studio_name || '',
          hasStudio: profile.has_studio || false,
          studioAddress: profile.studio_address || '',
          typicalTurnaroundDays: profile.typical_turnaround_days || null,
          
          // Talent fields
          heightCm: profile.height_cm || null,
          measurements: profile.measurements || '',
          eyeColor: profile.eye_color || '',
          hairColor: profile.hair_color || '',
          shoeSize: profile.shoe_size || '',
          clothingSizes: profile.clothing_sizes || '',
          tattoos: profile.tattoos || false,
          piercings: profile.piercings || false,
          talentCategories: profile.talent_categories || [],
          
          // Work preferences
          availabilityStatus: profile.availability_status || '',
          preferredWorkingHours: profile.preferred_working_hours || '',
          acceptsTfp: profile.accepts_tfp || false,
          acceptsExpensesOnly: profile.accepts_expenses_only || false,
          prefersStudio: profile.prefers_studio || false,
          prefersOutdoor: profile.prefers_outdoor || false,
          availableWeekdays: profile.available_weekdays || false,
          availableWeekends: profile.available_weekends || false,
          availableEvenings: profile.available_evenings || false,
          availableOvernight: profile.available_overnight || false,
          worksWithTeams: profile.works_with_teams || false,
          prefersSoloWork: profile.prefers_solo_work || false,
          
          // Content preferences
          comfortableWithNudity: profile.comfortable_with_nudity || false,
          comfortableWithIntimateContent: profile.comfortable_with_intimate_content || false,
          requiresModelRelease: profile.requires_model_release || false,
          
          // Privacy settings
          showAge: profile.show_age || true,
          showLocation: profile.show_location || true,
          showPhysicalAttributes: profile.show_physical_attributes || true,
          
          // Travel & documentation
          passportValid: profile.passport_valid || false
        })
        
        // Skip to profile step if user has basic info
        if (profile.display_name && profile.handle) {
          setCurrentStep('profile')
        }
      }
    } catch (err) {
      // No profile exists, continue with setup
      console.log('No existing profile found, continuing with setup')
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

    // Validation
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }
      
      try {
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
        setSelectedFile(file)
      } catch (error) {
        console.error('Error processing image:', error)
        setError('Error processing image. Please try another.')
      }
    }
  }

  const handleFinalSubmit = async () => {
    if (!user || !selectedRole || !supabase) return
    
    setLoading(true)
    setError(null)

    try {
      // Step 1: Upload profile photo if provided
      let avatarUrl = null
      if (selectedFile) {
        console.log('Uploading profile photo...')
        // TODO: Implement photo upload
        // avatarUrl = await uploadProfilePhoto(selectedFile, user.id)
      }

      // Step 2: Prepare profile data
      const roleFlags = selectedRole === 'BOTH' 
        ? ['CONTRIBUTOR', 'TALENT'] 
        : [selectedRole]

      const profileDataToSave = {
        display_name: displayName,
        handle: handle.toLowerCase(),
        bio: bio || null,
        city: city || null,
        country: country || null,
        avatar_url: avatarUrl,
        role_flags: roleFlags,
        style_tags: selectedStyles,
        vibe_tags: selectedVibes,
        
        // Social media & contact
        instagram_handle: profileData.instagramHandle || null,
        tiktok_handle: profileData.tiktokHandle || null,
        website_url: profileData.websiteUrl || null,
        portfolio_url: profileData.portfolioUrl || null,
        phone_number: profileData.phoneNumber || null,
        
        // Age & verification - CRITICAL
        date_of_birth: profileData.dateOfBirth || null,
        
        // Enhanced demographics
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
        
        // Work preferences
        availability_status: profileData.availabilityStatus || null,
        preferred_working_hours: profileData.preferredWorkingHours || null,
        accepts_tfp: profileData.acceptsTfp || false,
        accepts_expenses_only: profileData.acceptsExpensesOnly || false,
        prefers_studio: profileData.prefersStudio || false,
        prefers_outdoor: profileData.prefersOutdoor || false,
        available_weekdays: profileData.availableWeekdays || false,
        available_weekends: profileData.availableWeekends || false,
        available_evenings: profileData.availableEvenings || false,
        available_overnight: profileData.availableOvernight || false,
        works_with_teams: profileData.worksWithTeams || false,
        prefers_solo_work: profileData.prefersSoloWork || false,
        
        // Content preferences
        comfortable_with_nudity: profileData.comfortableWithNudity || false,
        comfortable_with_intimate_content: profileData.comfortableWithIntimateContent || false,
        requires_model_release: profileData.requiresModelRelease || false,
        
        // Privacy settings
        show_age: profileData.showAge || true,
        show_location: profileData.showLocation || true,
        show_physical_attributes: profileData.showPhysicalAttributes || true,
        
        // Travel & documentation
        passport_valid: profileData.passportValid || false,
        
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

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('users_profile')
          .update(profileDataToSave)
          .eq('user_id', user.id)
        profileError = error
      } else {
        // Create new profile
        const { error } = await supabase
          .from('users_profile')
          .insert({
            user_id: user.id,
            ...profileDataToSave,
            // Subscription defaults for new profiles
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

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Profile completion error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'role', label: 'Choose Role' },
      { key: 'profile', label: 'Basic Info' },
      { key: 'demographics', label: 'Demographics' },
      { key: 'details', label: 'Professional' },
      { key: 'preferences', label: 'Preferences' },
      { key: 'privacy', label: 'Privacy' },
      { key: 'styles', label: 'Style' }
    ]

    const currentIndex = steps.findIndex(s => s.key === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentIndex 
                ? 'bg-primary-600 border-primary-600 text-primary-foreground' 
                : 'bg-background border-border-300 text-muted-foreground-400'
            }`}>
              {index < currentIndex ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-primary-600' : 'bg-muted-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-primary/10 to-secondary-primary/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-muted-foreground-900 mb-2">
            Complete your profile
          </h1>
          <p className="text-muted-foreground-600">
            Tell us about yourself to get started on Preset
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-destructive-50 border border-destructive-200 text-destructive-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-background shadow-xl rounded-lg p-8">
          {/* Role Selection Step */}
          {currentStep === 'role' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-muted-foreground-900 mb-2">
                  How will you use Preset?
                </h2>
                <p className="text-muted-foreground-600">
                  Choose your primary role (you can change this later)
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => handleRoleSelection('CONTRIBUTOR')}
                  className="p-6 border-2 border-border-200 rounded-lg hover:border-primary-500 hover:bg-primary/10 transition-all text-left group"
                >
                  <div className="flex items-start">
                    <Camera className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground-900 mb-2">
                        I'm a Contributor
                      </h3>
                      <p className="text-muted-foreground-600">
                        I'm a photographer, videographer, or cinematographer looking for talent for my shoots
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground-400 group-hover:text-primary ml-auto flex-shrink-0" />
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelection('TALENT')}
                  className="p-6 border-2 border-border-200 rounded-lg hover:border-primary-500 hover:bg-primary/10 transition-all text-left group"
                >
                  <div className="flex items-start">
                    <Users className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground-900 mb-2">
                        I'm Talent
                      </h3>
                      <p className="text-muted-foreground-600">
                        I'm a model, actor, or creative looking to collaborate on shoots
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground-400 group-hover:text-primary ml-auto flex-shrink-0" />
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelection('BOTH')}
                  className="p-6 border-2 border-border-200 rounded-lg hover:border-primary-500 hover:bg-primary/10 transition-all text-left group"
                >
                  <div className="flex items-start">
                    <Sparkles className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground-900 mb-2">
                        I do both
                      </h3>
                      <p className="text-muted-foreground-600">
                        I'm both a creative professional and talent
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground-400 group-hover:text-primary ml-auto flex-shrink-0" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Profile Step */}
          {currentStep === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-muted-foreground-900 mb-2">
                  Tell us about yourself
                </h2>
                <p className="text-muted-foreground-600">
                  Add your basic information and profile photo
                </p>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarPreview ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-muted-100">
                        <img 
                          src={avatarPreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted-100 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-muted-foreground-400" />
                      </div>
                    )}
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview('')
                          setSelectedFile(null)
                        }}
                        className="absolute -top-1 -right-1 bg-destructive-500 text-primary-foreground rounded-full p-1 hover:bg-destructive-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-border-300 rounded-lg cursor-pointer hover:bg-muted-50 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Choose Photo</span>
                    </label>
                    <p className="text-xs text-muted-foreground-500 mt-2">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Display Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Handle * {handleAvailable && handle && (
                      <span className="text-primary-600 text-xs ml-2">
                        <Check className="inline w-3 h-3" /> Available
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground-400">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase())}
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        handleError ? 'border-destructive-500' : 'border-border-300'
                      }`}
                      placeholder="johndoe"
                      required
                    />
                  </div>
                  {handleError && (
                    <p className="text-xs text-destructive-600 mt-1">{handleError}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    City *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Dublin"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Country *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date of Birth - CRITICAL FIELD */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                  Date of Birth * <span className="text-destructive-500">(Required for age verification)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                  <input
                    type="date"
                    value={profileData.dateOfBirth || ''}
                    onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    max={new Date().toISOString().split('T')[0]} // Can't be in the future
                  />
                </div>
                <p className="text-xs text-muted-foreground-500 mt-1">
                  You must be 18 or older to use Preset. This information is required for age verification.
                </p>
              </div>

              {/* Social Media & Contact */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Social Media & Contact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Instagram
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                      <input
                        type="text"
                        value={profileData.instagramHandle || ''}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, instagramHandle: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="@username"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      TikTok
                    </label>
                    <div className="relative">
                      <Music2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                      <input
                        type="text"
                        value={profileData.tiktokHandle || ''}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, tiktokHandle: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="@username"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                      <input
                        type="url"
                        value={profileData.websiteUrl || ''}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, websiteUrl: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground-400" />
                      <input
                        type="tel"
                        value={profileData.phoneNumber || ''}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+353..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('role')}
                  className="flex-1 py-2 px-4 border border-border-300 rounded-lg text-muted-foreground-700 hover:bg-muted-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Demographics Step */}
          {currentStep === 'demographics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-muted-foreground-900 mb-2">
                  Demographics & Identity
                </h2>
                <p className="text-muted-foreground-600">
                  Help us understand your background and preferences for better matching
                </p>
              </div>

              {/* Basic Demographics */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Gender Identity
                    </label>
                    <select
                      value={profileData.genderIdentity || ''}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, genderIdentity: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      disabled={optionsLoading}
                    >
                      <option value="">Select...</option>
                      {getOptionNames(predefinedOptions.genderIdentities).map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Ethnicity
                    </label>
                    <select
                      value={profileData.ethnicity || ''}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, ethnicity: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      disabled={optionsLoading}
                    >
                      <option value="">Select...</option>
                      {getOptionNames(predefinedOptions.ethnicities).map(ethnicity => (
                        <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={profileData.nationality || ''}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, nationality: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      placeholder="Irish, American, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={profileData.stateProvince || ''}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, stateProvince: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      placeholder="Leinster, California, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={profileData.experienceLevel || ''}
                    onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, experienceLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                    disabled={optionsLoading}
                  >
                    <option value="">Select...</option>
                    {getOptionNames(predefinedOptions.experienceLevels).map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Physical Attributes */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Physical Attributes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={profileData.weightKg || ''}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, weightKg: parseInt(e.target.value) || null }))}
                      min="30"
                      max="200"
                      className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      placeholder="70"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Body Type
                    </label>
                    <select
                      value={profileData.bodyType || ''}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, bodyType: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      disabled={optionsLoading}
                    >
                      <option value="">Select...</option>
                      {getOptionNames(predefinedOptions.bodyTypes).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Hair Length
                    </label>
                    <select
                      value={profileData.hairLength || ''}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, hairLength: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      disabled={optionsLoading}
                    >
                      <option value="">Select...</option>
                      {getOptionNames(predefinedOptions.hairLengths).map(length => (
                        <option key={length} value={length}>{length}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Skin Tone
                  </label>
                  <select
                    value={profileData.skinTone || ''}
                    onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, skinTone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                    disabled={optionsLoading}
                  >
                    <option value="">Select...</option>
                    {getOptionNames(predefinedOptions.skinTones).map(tone => (
                      <option key={tone} value={tone}>{tone}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('profile')}
                  className="flex-1 py-2 px-4 border border-border-300 rounded-lg text-muted-foreground-700 hover:bg-muted-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  className="flex-1 py-2 px-4 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-muted-foreground-900 mb-2">
                  Additional Details
                </h2>
                <p className="text-muted-foreground-600">
                  Tell us more about your professional background
                </p>
              </div>

              {/* Contributor-specific fields */}
              {(selectedRole === 'CONTRIBUTOR' || selectedRole === 'BOTH') && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Creator Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={profileData.yearsExperience || 0}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Equipment
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {optionsLoading ? (
                          <div className="text-muted-foreground-500">Loading equipment options...</div>
                        ) : (
                          getOptionNames(predefinedOptions.equipmentOptions).map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                const current = profileData.equipment || []
                                const updated = current.includes(item) 
                                  ? current.filter((i: string) => i !== item)
                                  : [...current, item]
                                setProfileData((prev: typeof profileData) => ({ ...prev, equipment: updated }))
                              }}
                              className={`px-3 py-2 text-sm rounded-lg transition ${
                                (profileData.equipment || []).includes(item)
                                  ? 'bg-primary-600 text-primary-foreground'
                                  : 'bg-muted-100 text-muted-foreground-700 hover:bg-muted-200'
                              }`}
                            >
                              {item}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Editing Software
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SOFTWARE_OPTIONS.map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              const current = profileData.editingSoftware || []
                              const updated = current.includes(item) 
                                ? current.filter((i: string) => i !== item)
                                : [...current, item]
                              setProfileData((prev: typeof profileData) => ({ ...prev, editingSoftware: updated }))
                            }}
                            className={`px-3 py-2 text-sm rounded-lg transition ${
                              (profileData.editingSoftware || []).includes(item)
                                ? 'bg-primary-600 text-primary-foreground'
                                : 'bg-muted-100 text-muted-foreground-700 hover:bg-muted-200'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.hasStudio || false}
                          onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, hasStudio: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-muted-foreground-700">I have a studio</span>
                      </label>
                      
                      {profileData.hasStudio && (
                        <input
                          type="text"
                          value={profileData.studioName || ''}
                          onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, studioName: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Studio name"
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Typical Turnaround (days)
                      </label>
                      <input
                        type="number"
                        value={profileData.typicalTurnaroundDays || 7}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, typicalTurnaroundDays: parseInt(e.target.value) || 7 }))}
                        min="1"
                        max="30"
                        className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Talent-specific fields */}
              {(selectedRole === 'TALENT' || selectedRole === 'BOTH') && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Talent Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Categories
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {TALENT_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              const current = profileData.talentCategories || []
                              const updated = current.includes(cat) 
                                ? current.filter((i: string) => i !== cat)
                                : [...current, cat]
                              setProfileData((prev: typeof profileData) => ({ ...prev, talentCategories: updated }))
                            }}
                            className={`px-3 py-2 text-sm rounded-lg transition ${
                              (profileData.talentCategories || []).includes(cat)
                                ? 'bg-primary-600 text-primary-foreground'
                                : 'bg-muted-100 text-muted-foreground-700 hover:bg-muted-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          value={profileData.heightCm || ''}
                          onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, heightCm: parseInt(e.target.value) || null }))}
                          min="100"
                          max="250"
                          className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                          placeholder="175"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                          Eye Color
                        </label>
                        <select
                          value={profileData.eyeColor || ''}
                          onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, eyeColor: e.target.value }))}
                          className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                        >
                          <option value="">Select...</option>
                          {getOptionNames(predefinedOptions.eyeColors).map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                          Hair Color
                        </label>
                        <select
                          value={profileData.hairColor || ''}
                          onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, hairColor: e.target.value }))}
                          className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                        >
                          <option value="">Select...</option>
                          {getOptionNames(predefinedOptions.hairColors).map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.tattoos || false}
                          onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, tattoos: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-muted-foreground-700">Has tattoos</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.piercings || false}
                          onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, piercings: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-muted-foreground-700">Has piercings</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('profile')}
                  className="flex-1 py-2 px-4 border border-border-300 rounded-lg text-muted-foreground-700 hover:bg-muted-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('preferences')}
                  className="flex-1 py-2 px-4 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Preferences Step */}
          {currentStep === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-muted-foreground-900 mb-2">
                  Work Preferences
                </h2>
                <p className="text-muted-foreground-600">
                  Tell us about your work preferences and availability
                </p>
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Availability Status
                  </label>
                  <select
                    value={profileData.availabilityStatus || ''}
                    onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, availabilityStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                    disabled={optionsLoading}
                  >
                    <option value="">Select...</option>
                    {getOptionNames(predefinedOptions.availabilityStatuses).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Preferred Working Hours
                  </label>
                  <input
                    type="text"
                    value={profileData.preferredWorkingHours || ''}
                    onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, preferredWorkingHours: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-muted-foreground-900"
                    placeholder="9 AM - 5 PM, Flexible, etc."
                  />
                </div>
              </div>

              {/* Work Type Preferences */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Work Type Preferences</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.acceptsTfp || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, acceptsTfp: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Accepts TFP (Trade for Portfolio)</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.acceptsExpensesOnly || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, acceptsExpensesOnly: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Accepts Expenses Only</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.prefersStudio || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, prefersStudio: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Prefers Studio Work</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.prefersOutdoor || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, prefersOutdoor: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Prefers Outdoor Work</span>
                    </label>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.worksWithTeams || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, worksWithTeams: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Works with Teams</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.prefersSoloWork || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, prefersSoloWork: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Prefers Solo Work</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.availableWeekdays || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, availableWeekdays: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Available Weekdays</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.availableWeekends || false}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, availableWeekends: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Available Weekends</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content Preferences */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Content Preferences</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.comfortableWithNudity || false}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, comfortableWithNudity: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-muted-foreground-700">Comfortable with Nudity</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.comfortableWithIntimateContent || false}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, comfortableWithIntimateContent: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-muted-foreground-700">Comfortable with Intimate Content</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.requiresModelRelease || false}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, requiresModelRelease: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-muted-foreground-700">Requires Model Release</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  className="flex-1 py-2 px-4 border border-border-300 rounded-lg text-muted-foreground-700 hover:bg-muted-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('privacy')}
                  className="flex-1 py-2 px-4 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Privacy Step */}
          {currentStep === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-muted-foreground-900 mb-2">
                  Privacy Settings
                </h2>
                <p className="text-muted-foreground-600">
                  Control what information is visible to other users
                </p>
              </div>

              {/* Privacy Controls */}
              <div className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">Profile Visibility</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.showAge || true}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, showAge: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Show Age</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.showLocation || true}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, showLocation: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Show Location</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.showPhysicalAttributes || true}
                        onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, showPhysicalAttributes: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-muted-foreground-700">Show Physical Attributes</span>
                    </label>
                  </div>
                </div>

                {/* Travel & Documentation */}
                <div className="bg-primary-50 border border-primary/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">Travel & Documentation</h3>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.passportValid || false}
                      onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, passportValid: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-muted-foreground-700">Valid Passport (for international travel)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('preferences')}
                  className="flex-1 py-2 px-4 border border-border-300 rounded-lg text-muted-foreground-700 hover:bg-muted-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('styles')}
                  className="flex-1 py-2 px-4 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Styles Step */}
          {currentStep === 'styles' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-muted-foreground-900 mb-2">
                  Define your style
                </h2>
                <p className="text-muted-foreground-600">
                  Choose tags that best describe your creative style
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground-700 mb-3">
                  Style tags (select up to 5)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {optionsLoading ? (
                    <div className="text-muted-foreground-500">Loading style options...</div>
                  ) : (
                    getOptionNames(predefinedOptions.styleTags).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleStyle(style)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedStyles.includes(style)
                            ? 'bg-primary-600 text-primary-foreground'
                            : 'bg-muted-100 text-muted-foreground-700 hover:bg-muted-200'
                        }`}
                      >
                        {style}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground-700 mb-3">
                  Your vibe (select up to 3)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {optionsLoading ? (
                    <div className="text-muted-foreground-500">Loading vibe options...</div>
                  ) : (
                    getOptionNames(predefinedOptions.vibeTags).map((vibe) => (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => toggleVibe(vibe)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedVibes.includes(vibe)
                            ? 'bg-secondary-600 text-primary-foreground'
                            : 'bg-muted-100 text-muted-foreground-700 hover:bg-muted-200'
                        }`}
                      >
                        {vibe}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-border-300 rounded-lg text-muted-foreground-700 hover:bg-muted-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Saving profile...' : 'Complete setup'}
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground-500">
                You can always update these preferences later in your settings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
