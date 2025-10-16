'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { CompType, PurposeType, StatusType, LookingForType, GigFormData } from '../../../lib/gig-form-persistence'
import StepIndicator, { GigEditStep } from '../../components/gig-edit-steps/StepIndicator'
import BasicDetailsStep from '../../components/gig-edit-steps/BasicDetailsStep'
import LocationScheduleStep from '../../components/gig-edit-steps/LocationScheduleStep'
import RequirementsStep from '../../components/gig-edit-steps/RequirementsStep'
import ApplicantPreferencesStep from '../../components/gig-edit-steps/ApplicantPreferencesStep'
import MoodboardStep from '../../components/gig-edit-steps/MoodboardStep'
import ReviewPublishStep from '../../components/gig-edit-steps/ReviewPublishStep'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateGigPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Step management
  const [currentStep, setCurrentStep] = useState<GigEditStep>('basic')
  const [completedSteps, setCompletedSteps] = useState<GigEditStep[]>([])
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  
  // Form state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // User profile state
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<string>('FREE')
  
  // Form data
  const [formData, setFormData] = useState<GigFormData>({
    title: '',
    description: '',
    lookingFor: undefined,
    purpose: 'PORTFOLIO',
    compType: 'TFP',
    compDetails: '',
    budgetMin: null,
    budgetMax: null,
    budgetType: 'hourly',
    usageRights: '',
    location: '',
    startDate: '',
    endDate: '',
    applicationDeadline: '',
    maxApplicants: 10,
    safetyNotes: '',
    status: 'DRAFT',
    moodboardId: undefined
  })
  
  // Temporary gig ID for moodboard creation
  const [tempGigId, setTempGigId] = useState<string | null>(null)
  
  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('users_profile')
            .select('subscription_tier')
            .eq('user_id', user.id)
            .single()
          
          if (profile) {
            setUserSubscriptionTier(profile.subscription_tier || 'FREE')
          }
        } catch (error) {
          console.warn('Failed to fetch user profile:', error)
        }
      }
    }
    
    fetchUserProfile()
  }, [user])

  // Check for unsaved data on mount
  useEffect(() => {
    const checkUnsavedData = () => {
      try {
        const savedData = localStorage.getItem('gig-create-draft')
        if (savedData) {
          const parsed = JSON.parse(savedData)
          if (Object.keys(parsed).length > 1) { // More than just timestamp
            setShowRestorePrompt(true)
          }
        }
      } catch (error) {
        console.warn('Failed to check for unsaved data:', error)
      }
    }
    
    checkUnsavedData()
  }, [])
  
  // Create temporary gig when entering moodboard step
  useEffect(() => {
    if (currentStep === 'moodboard' && !tempGigId) {
      createTempGig().catch(err => {
        console.error('Failed to create temp gig:', err)
        setError('Failed to prepare moodboard creation. Please try again.')
      })
    }
  }, [currentStep, tempGigId])
  
  // Save form data to localStorage with error handling
  const saveFormData = (data: Partial<GigFormData>) => {
    try {
      // Check localStorage quota before saving
      const testKey = 'preset-quota-check'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      
      const updated = { ...formData, ...data }
      setFormData(updated)
      localStorage.setItem('gig-create-draft', JSON.stringify({
        ...updated,
        lastSaved: new Date().toISOString()
      }))
      
      // Log successful save in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Gig creation form data saved successfully')
      }
    } catch (error) {
      console.warn('❌ Failed to save form data:', error)
      // Don't crash the app, just skip auto-save
      // This prevents localStorage issues from affecting auth
    }
  }
  
  // Restore unsaved data
  const restoreUnsavedData = () => {
    try {
      const savedData = localStorage.getItem('gig-create-draft')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        setFormData(prev => ({ ...prev, ...parsed }))
        setShowRestorePrompt(false)
      }
    } catch (error) {
      console.warn('Failed to restore data:', error)
    }
  }
  
  // Clear unsaved data
  const clearUnsavedData = () => {
    try {
      localStorage.removeItem('gig-create-draft')
      setShowRestorePrompt(false)
    } catch (error) {
      console.warn('Failed to clear data:', error)
    }
  }
  
  // Step navigation
  const goToStep = (step: GigEditStep) => {
    setCurrentStep(step)
  }
  
  const goToNextStep = () => {
    const steps: GigEditStep[] = ['basic', 'schedule', 'requirements', 'moodboard', 'review']
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
  
  const goToPreviousStep = () => {
    const steps: GigEditStep[] = ['basic', 'schedule', 'requirements', 'moodboard', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }
  
  // Validation functions
  const validateBasicDetails = () => {
    const lookingForValid = formData.lookingFor !== undefined
    const titleValid = formData.title.trim() !== ''
    const descriptionValid = formData.description.trim().length >= 50
    const compDetailsValid = formData.compType === 'TFP' || formData.compType === 'OTHER' ||
                            (formData.compType === 'PAID' && formData.compDetails?.trim() !== '') ||
                            (formData.compType === 'EXPENSES' && formData.compDetails?.trim() !== '')

    return lookingForValid && titleValid && descriptionValid && compDetailsValid
  }
  
  const validateSchedule = () => {
    if (!formData.location.trim()) return false
    if (!formData.startDate || !formData.endDate) return false
    
    const startTime = new Date(formData.startDate)
    const endTime = new Date(formData.endDate)
    const deadline = formData.applicationDeadline ? new Date(formData.applicationDeadline) : null
    
    if (endTime <= startTime) return false
    if (deadline && deadline >= startTime) return false
    
    return true
  }
  
  const getScheduleValidationErrors = () => {
    const errors: string[] = []
    
    if (!formData.location.trim()) {
      errors.push('Location is required')
    }
    
    if (!formData.startDate) {
      errors.push('Start date and time is required')
    }
    
    if (!formData.endDate) {
      errors.push('End date and time is required')
    }
    
    if (formData.startDate && formData.endDate) {
      const startTime = new Date(formData.startDate)
      const endTime = new Date(formData.endDate)
      
      if (endTime <= startTime) {
        errors.push('End time must be after start time')
      }
    }
    
    if (formData.applicationDeadline && formData.startDate) {
      const deadline = new Date(formData.applicationDeadline)
      const startTime = new Date(formData.startDate)
      
      if (deadline >= startTime) {
        errors.push('Application deadline must be before the shoot starts')
      }
    }
    
    return errors
  }
  
  const validateRequirements = () => {
    return formData.usageRights.trim() !== '' && formData.maxApplicants > 0
  }
  
  // Create temporary gig for moodboard
  const createTempGig = async () => {
    if (tempGigId) return tempGigId
    
    // Generate a temporary UUID for the moodboard without creating a database record
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setTempGigId(tempId)
    return tempId
  }
  
  // Final save function
  const handleSaveGig = async () => {
    if (!user) {
      setError('You must be logged in to create a gig')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (profileError || !profile) {
        throw new Error('Profile not found. Please complete your profile first.')
      }
      
      // Always create new gig since temp gigs are not stored in database
      let gigId = null
      
      // Parse location into city and country if formatted correctly
      // Use separate city and country fields if available, otherwise parse from location_text
      const city = formData.city || formData.location.split(',')[0]?.trim() || null
      const country = formData.country || formData.location.split(',')[1]?.trim() || null
      
      // Create new gig
      const gigData = {
        owner_user_id: profile.id,
        title: formData.title,
        description: formData.description,
        looking_for: formData.lookingFor || [],  // Use correct column name
        purpose: formData.purpose,
        comp_type: formData.compType,
        comp_details: formData.compDetails,
        budget_min: formData.budgetMin,
        budget_max: formData.budgetMax,
        budget_type: formData.budgetType,
        usage_rights: formData.usageRights,
        start_time: formData.startDate,
        end_time: formData.endDate,
        status: formData.status,
        location_text: formData.location,  // Keep for backward compatibility
        city: city,
        country: country,
        application_deadline: formData.applicationDeadline,
        max_applicants: formData.maxApplicants,
        safety_notes: formData.safetyNotes,
        applicant_preferences: formData.applicantPreferences || {}
      }
      
      const { data, error: insertError } = await supabase
        .from('gigs')
        .insert(gigData)
        .select()
        .single()
      
      if (insertError) throw insertError
      gigId = data.id
      
      // Update moodboard to link to the real gig ID and make it public if one exists
      if (formData.moodboardId) {
        try {
          const { error: moodboardError } = await supabase
            .from('moodboards')
            .update({ 
              gig_id: gigId,
              is_public: true  // Make moodboard public when linked to a gig
            })
            .eq('id', formData.moodboardId)
          
          if (moodboardError) {
            console.warn('Failed to link moodboard to gig:', moodboardError)
          } else {
            console.log('✅ Moodboard linked to gig and made public successfully')
          }
        } catch (error) {
          console.warn('Error linking moodboard to gig:', error)
        }
      }
      
      // Clear saved data
      clearUnsavedData()
      
      // Send notifications if gig is being published
      if (formData.status === 'PUBLISHED') {
        try {
          console.log('📢 Sending gig creation notifications...')
          
          // Get session for the API call
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const response = await fetch('/api/notifications/gig-created', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`},
              body: JSON.stringify({
                gigId,
                publishNow: true
              })})

            const data = await response.json()
            console.log('📦 Notification API response:', data)
            
            if (data.success && data.notificationsSent > 0) {
              console.log(`✅ Successfully sent ${data.notificationsSent} notifications`)
            }
          }
        } catch (notificationError) {
          console.warn('Failed to send gig notifications:', notificationError)
          // Don't fail the gig creation if notifications fail
        }
      }
      
      // Redirect to gig detail page
      router.push(`/gigs/${gigId}`)
    } catch (err: any) {
      console.error('Error saving gig:', err)
      setError(err?.message || err?.details || 'Failed to save gig')
      setSaving(false)
    }
  }
  
  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <BasicDetailsStep
            title={formData.title}
            description={formData.description}
            lookingFor={formData.lookingFor}
            purpose={formData.purpose!}
            compType={formData.compType}
            compDetails={formData.compDetails || ''}
            budgetMin={formData.budgetMin}
            budgetMax={formData.budgetMax}
            budgetType={formData.budgetType}
            userSubscriptionTier={userSubscriptionTier}
            onTitleChange={(value) => saveFormData({ title: value })}
            onDescriptionChange={(value) => saveFormData({ description: value })}
            onLookingForChange={(value) => saveFormData({ lookingFor: value })}
            onPurposeChange={(value) => saveFormData({ purpose: value })}
            onCompTypeChange={(value) => saveFormData({ compType: value })}
            onCompDetailsChange={(value) => saveFormData({ compDetails: value })}
            onBudgetMinChange={(value) => saveFormData({ budgetMin: value })}
            onBudgetMaxChange={(value) => saveFormData({ budgetMax: value })}
            onBudgetTypeChange={(value) => saveFormData({ budgetType: value })}
            onNext={goToNextStep}
            isValid={validateBasicDetails()}
          />
        )
      
      case 'schedule':
        return (
          <LocationScheduleStep
            location={formData.location}
            city={formData.city}
            country={formData.country}
            startDate={formData.startDate}
            endDate={formData.endDate}
            applicationDeadline={formData.applicationDeadline}
            onLocationChange={(value) => {
              // Parse and save city, country, and location together
              const parts = value.split(',').map(p => p.trim())
              saveFormData({ 
                location: value,
                city: parts[0] || formData.city,
                country: parts[1] || formData.country
              })
            }}
            onCityChange={(value) => {
              const location = formData.country ? `${value}, ${formData.country}` : value
              saveFormData({ city: value, location })
            }}
            onCountryChange={(value) => {
              const location = formData.city ? `${formData.city}, ${value}` : value
              saveFormData({ country: value, location })
            }}
            onStartDateChange={(value) => saveFormData({ startDate: value })}
            onEndDateChange={(value) => saveFormData({ endDate: value })}
            onApplicationDeadlineChange={(value) => saveFormData({ applicationDeadline: value })}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            isValid={validateSchedule()}
            validationErrors={getScheduleValidationErrors()}
          />
        )
      
      case 'requirements':
        return (
          <RequirementsStep
            usageRights={formData.usageRights}
            maxApplicants={formData.maxApplicants}
            safetyNotes={formData.safetyNotes || ''}
            onUsageRightsChange={(value) => saveFormData({ usageRights: value })}
            onMaxApplicantsChange={(value) => saveFormData({ maxApplicants: value })}
            onSafetyNotesChange={(value) => saveFormData({ safetyNotes: value })}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            isValid={validateRequirements()}
            applicationCount={0}
          />
        )
      
      case 'preferences':
        return (
          <ApplicantPreferencesStep
            lookingFor={formData.lookingFor}
            preferences={formData.applicantPreferences || {
              physical: {
                height_range: { min: null, max: null },
                measurements: { required: false, specific: null },
                eye_color: { required: false, preferred: [] },
                hair_color: { required: false, preferred: [] },
                tattoos: { allowed: true, required: false },
                piercings: { allowed: true, required: false },
                clothing_sizes: { required: false, preferred: [] }
              },
              professional: {
                experience_years: { min: null, max: null },
                specializations: { required: [], preferred: [] },
                equipment: { required: [], preferred: [] },
                software: { required: [], preferred: [] },
                talent_categories: { required: [], preferred: [] },
                portfolio_required: false
              },
              availability: {
                travel_required: false,
                travel_radius_km: null,
                hourly_rate_range: { min: null, max: null }
              },
              other: {
                age_range: { min: 18, max: null },
                languages: { required: [], preferred: [] },
                additional_requirements: ''
              }
            }}
            onPreferencesChange={(preferences) => saveFormData({ applicantPreferences: preferences })}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            loading={loading}
          />
        )
      
      case 'moodboard':
        return (
          <MoodboardStep
            gigId={tempGigId || 'temp-' + Date.now()}
            moodboardId={formData.moodboardId}
            onMoodboardSave={(id) => {
              saveFormData({ moodboardId: id })
              goToNextStep()
            }}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )
      
      case 'review':
        return (
          <ReviewPublishStep
            title={formData.title}
            description={formData.description}
            purpose={formData.purpose!}
            compType={formData.compType}
            compDetails={formData.compDetails}
            location={formData.location}
            startDate={formData.startDate}
            endDate={formData.endDate}
            applicationDeadline={formData.applicationDeadline}
            usageRights={formData.usageRights}
            maxApplicants={formData.maxApplicants}
            safetyNotes={formData.safetyNotes}
            status={formData.status}
            moodboardId={formData.moodboardId}
            applicantPreferences={formData.applicantPreferences}
            onStatusChange={(value) => saveFormData({ status: value })}
            onBack={goToPreviousStep}
            onSave={handleSaveGig}
            saving={saving}
            applicationCount={0}
            warnings={[]}
          />
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-8 border border-border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-3" />
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold text-primary mb-2">Create a New Gig</h1>
                <p className="text-lg sm:text-xl text-muted-foreground">Follow the steps below to create your gig and attract the right talent</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        </div>

        
        {/* Restore Prompt */}
        {showRestorePrompt && (
          <div className="mb-6 bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-primary mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Unsaved Changes Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You have unsaved changes from a previous session. Would you like to restore them?
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={restoreUnsavedData}
                    size="sm"
                  >
                    Restore Changes
                  </Button>
                  <Button
                    onClick={clearUnsavedData}
                    variant="outline"
                    size="sm"
                  >
                    Discard & Start Fresh
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-destructive">Error</h3>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Display */}
        {success && (
          <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-primary">Success</h3>
                <p className="text-sm text-primary/80 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
        
        {/* Current Step Content */}
        {renderCurrentStep()}
      </div>
    </div>
  )
}