'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Step components
import StepIndicator, { ProfileEditStep } from '@/app/components/profile-edit-steps/StepIndicator'
import BasicDetailsStep from '@/app/components/profile-edit-steps/BasicDetailsStep'
import ProfessionalStep from '@/app/components/profile-edit-steps/ProfessionalStep'
import ContactStep from '@/app/components/profile-edit-steps/ContactStep'
import AvailabilityStep from '@/app/components/profile-edit-steps/AvailabilityStep'
import ReviewStep from '@/app/components/profile-edit-steps/ReviewStep'
import { ProfileCompletionBar } from '@/app/components/profile-edit-steps/ProfileCompletionBar'
import { ProfilePreview } from '@/app/components/profile-edit-steps/ProfilePreview'

// Hooks and utilities
import { ProfileFormData } from '@/lib/profile-validation'

// Simple profile completion calculation (simplified version)
const calculateCompletion = (data: ProfileFormData) => {
  const fields = [
    'display_name', 'handle', 'bio', 'city', 'country',
    'years_experience', 'specializations', 'professional_skills',
    'instagram_handle', 'portfolio_url', 'website_url',
    'availability_status', 'hourly_rate_min', 'hourly_rate_max'
  ]
  
  const completed = fields.filter(field => {
    const value = data[field as keyof ProfileFormData]
    return value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
  }).length
  
  return {
    percentage: Math.round((completed / fields.length) * 100),
    missingCount: fields.length - completed
  }
}

export default function EditProfilePage() {
  const { user, userRole, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // Form state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<ProfileEditStep>('basic')
  const [completedSteps, setCompletedSteps] = useState<ProfileEditStep[]>([])
  
  // Image state
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [headerBannerUrl, setHeaderBannerUrl] = useState<string>('')
  
  // Form data
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    handle: '',
    bio: '',
    city: '',
    country: '',
    years_experience: undefined,
    languages: [],
    specializations: [],
    equipment_list: [],
    editing_software: [],
    professional_skills: [],
    contributor_roles: [],
    talent_categories: [],
    experience_level: 'beginner',
    instagram_handle: '',
    tiktok_handle: '',
    website_url: '',
    portfolio_url: '',
    behance_url: '',
    dribbble_url: '',
    phone_number: '',
    availability_status: 'available',
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    available_for_travel: false,
    travel_radius_km: 50,
    has_studio: false,
    studio_name: '',
    available_weekdays: true,
    available_weekends: false,
    available_evenings: false,
    available_overnight: false,
    accepts_tfp: false,
    accepts_expenses_only: false,
    allow_direct_booking: true,
    show_experience: true,
    show_specializations: true,
    show_equipment: true,
    show_social_links: true,
    show_website: true,
    show_phone: false,
    phone_public: false,
    email_public: false,
    show_rates: false,
    show_availability: true
  })

  // Form persistence state (simplified for now)
  const [hasUnsavedData, setHasUnsavedData] = useState(false)

  // Initialize form data
  useEffect(() => {
    const initializeForm = async () => {
      if (!user) return

      try {
        // For now, skip saved form data restoration

        // Fetch current profile data
        const { data: profile, error: profileError } = await supabase
          .from('users_profile')
          .select(`
            id, display_name, handle, bio, city, country,
            years_experience, languages, specializations,
            equipment_list, editing_software, professional_skills,
            contributor_roles, talent_categories, experience_level,
            instagram_handle, tiktok_handle, website_url,
            portfolio_url, behance_url, dribbble_url,
            phone_number, availability_status,
            hourly_rate_min, hourly_rate_max, available_for_travel,
            travel_radius_km, has_studio, studio_name,
            available_weekdays, available_weekends, available_evenings,
            available_overnight, accepts_tfp, accepts_expenses_only,
            allow_direct_booking, show_experience, show_specializations,
            show_equipment, show_social_links, show_website,
            show_phone, phone_public, email_public, show_rates,
            show_availability, avatar_url, header_banner_url, header_banner_position
          `)
          .eq('user_id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load profile data')
      return
    }

        console.log('Fetched profile data:', {
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          header_banner_url: profile?.header_banner_url
        })

        // Initialize form data from profile
        const initialData = {
          display_name: profile.display_name || '',
          handle: profile.handle || '',
          bio: profile.bio || '',
          city: profile.city || '',
          country: profile.country || '',
          years_experience: profile.years_experience,
          languages: profile.languages || [],
          specializations: profile.specializations || [],
          equipment_list: profile.equipment_list || [],
          editing_software: profile.editing_software || [],
          professional_skills: profile.professional_skills || [],
          contributor_roles: profile.contributor_roles || [],
          talent_categories: profile.talent_categories || [],
          experience_level: profile.experience_level || 'beginner',
          instagram_handle: profile.instagram_handle || '',
          tiktok_handle: profile.tiktok_handle || '',
          website_url: profile.website_url || '',
          portfolio_url: profile.portfolio_url || '',
          behance_url: profile.behance_url || '',
          dribbble_url: profile.dribbble_url || '',
          phone_number: profile.phone_number || '',
          availability_status: profile.availability_status || 'available',
          hourly_rate_min: profile.hourly_rate_min,
          hourly_rate_max: profile.hourly_rate_max,
          available_for_travel: profile.available_for_travel || false,
          travel_radius_km: profile.travel_radius_km || 50,
          has_studio: profile.has_studio || false,
          studio_name: profile.studio_name || '',
          available_weekdays: profile.available_weekdays ?? true,
          available_weekends: profile.available_weekends || false,
          available_evenings: profile.available_evenings || false,
          available_overnight: profile.available_overnight || false,
          accepts_tfp: profile.accepts_tfp || false,
          accepts_expenses_only: profile.accepts_expenses_only || false,
          allow_direct_booking: profile.allow_direct_booking ?? true,
          show_experience: profile.show_experience ?? true,
          show_specializations: profile.show_specializations ?? true,
          show_equipment: profile.show_equipment ?? true,
          show_social_links: profile.show_social_links ?? true,
          show_website: profile.show_website ?? true,
          show_phone: profile.show_phone || false,
          phone_public: profile.phone_public || false,
          email_public: profile.email_public || false,
          show_rates: profile.show_rates || false,
          show_availability: profile.show_availability ?? true,
          avatar_url: profile.avatar_url || '',
          header_banner_url: profile.header_banner_url || '',
          header_banner_position: profile.header_banner_position || ''
        }

        setFormData(initialData)

        // Initialize image URLs
        setAvatarUrl(profile.avatar_url || '')
        setHeaderBannerUrl(profile.header_banner_url || '')

    } catch (error) {
        console.error('Error initializing form:', error)
        setError('Failed to initialize form')
    } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      initializeForm()
    }
  }, [user, authLoading])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedData(true)
  }, [formData])

  // Handle form data changes
  const handleFormDataChange = (newData: Partial<ProfileFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }

  // Handle step navigation
  const handleStepClick = (step: ProfileEditStep) => {
    if (completedSteps.includes(step) || step === 'basic') {
      setCurrentStep(step)
    }
  }

  // Handle next step
  const handleNext = () => {
    const steps: ProfileEditStep[] = ['basic', 'professional', 'contact', 'availability', 'review']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1]
      setCurrentStep(nextStep)
      
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    const steps: ProfileEditStep[] = ['basic', 'professional', 'contact', 'availability', 'review']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1]
      setCurrentStep(prevStep)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.handle) {
      setError('Handle is required')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/users/${formData.handle}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        
        // Redirect to profile page after a short delay
          setTimeout(() => {
          router.push(`/users/${data.profile?.handle || formData.handle}`)
          }, 2000)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  // Note: Restore functionality removed for now to fix navigation issues

  const steps: ProfileEditStep[] = ['basic', 'professional', 'contact', 'availability', 'review']
  const currentStepIndex = steps.indexOf(currentStep)
  const isLastStep = currentStepIndex === steps.length - 1

  if (authLoading || loading || !formData.handle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent absolute top-0"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">
            Complete your profile to increase visibility and attract more opportunities
          </p>
        </div>

        {/* Restore prompt removed for now */}

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-primary/20 bg-primary-50 text-primary-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Preview */}
        <ProfilePreview
          formData={formData}
          avatarUrl={avatarUrl}
          headerBannerUrl={headerBannerUrl}
          userId={user?.id}
          onAvatarChange={(newUrl: string) => {
            setAvatarUrl(newUrl)
          }}
          onHeaderChange={(newUrl: string) => {
            setHeaderBannerUrl(newUrl)
          }}
        />

        {/* Profile Completion Progress */}
        <ProfileCompletionBar
          completionPercentage={calculateCompletion(formData).percentage}
          missingFieldsCount={calculateCompletion(formData).missingCount}
        />

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 'basic' && (
            <BasicDetailsStep
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {currentStep === 'professional' && (
            <ProfessionalStep
              formData={formData}
              setFormData={setFormData}
              userRole={userRole}
            />
          )}

          {currentStep === 'contact' && (
            <ContactStep
              data={formData}
              onChange={handleFormDataChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}

          {currentStep === 'availability' && (
            <AvailabilityStep
              data={formData}
              onChange={handleFormDataChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}

          {currentStep === 'review' && (
            <ReviewStep
              data={formData}
              onSave={handleSubmit}
              onPrevious={handlePrevious}
              saving={saving}
              isLastStep={true}
            />
                )}
              </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
                <Button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0 || saving}
            variant="outline"
          >
            Previous
                </Button>
                <Button
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={saving}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : isLastStep ? (
              'Save Profile'
            ) : (
              'Next'
            )}
                </Button>
              </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedData && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg p-3 shadow-lg z-50">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
          </div>
        )}
      </div>
    </div>
  )
}