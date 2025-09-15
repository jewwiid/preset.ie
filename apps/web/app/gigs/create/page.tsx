'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { CompType, PurposeType, StatusType, GigFormData } from '../../../lib/gig-form-persistence'
import StepIndicator, { GigEditStep } from '../../components/gig-edit-steps/StepIndicator'
import BasicDetailsStep from '../../components/gig-edit-steps/BasicDetailsStep'
import LocationScheduleStep from '../../components/gig-edit-steps/LocationScheduleStep'
import RequirementsStep from '../../components/gig-edit-steps/RequirementsStep'
import MoodboardStep from '../../components/gig-edit-steps/MoodboardStep'
import ReviewPublishStep from '../../components/gig-edit-steps/ReviewPublishStep'

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
  
  // Form data
  const [formData, setFormData] = useState<GigFormData>({
    title: '',
    description: '',
    purpose: 'PORTFOLIO',
    compType: 'TFP',
    compDetails: '',
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
  
  // Save form data to localStorage
  const saveFormData = (data: Partial<GigFormData>) => {
    try {
      const updated = { ...formData, ...data }
      setFormData(updated)
      localStorage.setItem('gig-create-draft', JSON.stringify({
        ...updated,
        lastSaved: new Date().toISOString()
      }))
    } catch (error) {
      console.warn('Failed to save form data:', error)
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
    const titleValid = formData.title.trim() !== ''
    const descriptionValid = formData.description.trim().length >= 50
    const compDetailsValid = formData.compType === 'TFP' || formData.compType === 'OTHER' || 
                            (formData.compType === 'PAID' && formData.compDetails?.trim() !== '') ||
                            (formData.compType === 'EXPENSES' && formData.compDetails?.trim() !== '')
    
    return titleValid && descriptionValid && compDetailsValid
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
  
  const validateRequirements = () => {
    return formData.usageRights.trim() !== '' && formData.maxApplicants > 0
  }
  
  // Create temporary gig for moodboard
  const createTempGig = async () => {
    if (tempGigId) return tempGigId
    
    if (!user) throw new Error('User not authenticated')
    
    if (!supabase) {
      throw new Error('Database connection not available')
    }

    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }
    
    const gigData = {
      owner_user_id: profile.id,
      title: formData.title || 'Temporary Gig',
      description: formData.description || 'Temporary gig for moodboard creation',
      purpose: formData.purpose,
      comp_type: formData.compType,
      usage_rights: formData.usageRights || 'Portfolio use only',
      start_time: formData.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: formData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
      status: 'DRAFT',
      location_text: formData.location || 'Location TBD',
      application_deadline: formData.applicationDeadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      max_applicants: formData.maxApplicants
    }
    
    const { data, error } = await supabase
      .from('gigs')
      .insert(gigData)
      .select()
      .single()
    
    if (error) throw error
    
    setTempGigId(data.id)
    return data.id
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
      
      // Use temp gig ID if we have one, otherwise create new gig
      let gigId = tempGigId
      
      if (!gigId) {
        // Create new gig
        const gigData = {
          owner_user_id: profile.id,
          title: formData.title,
          description: formData.description,
          purpose: formData.purpose,
          comp_type: formData.compType,
          comp_details: formData.compDetails,
          usage_rights: formData.usageRights,
          start_time: formData.startDate,
          end_time: formData.endDate,
          status: formData.status,
          location_text: formData.location,
          application_deadline: formData.applicationDeadline,
          max_applicants: formData.maxApplicants,
          safety_notes: formData.safetyNotes
        }
        
        const { data, error: insertError } = await supabase
          .from('gigs')
          .insert(gigData)
          .select()
          .single()
        
        if (insertError) throw insertError
        gigId = data.id
      } else {
        // Update existing temp gig
        const { error: updateError } = await supabase
          .from('gigs')
          .update({
            title: formData.title,
            description: formData.description,
            purpose: formData.purpose,
            comp_type: formData.compType,
            usage_rights: formData.usageRights,
            start_time: formData.startDate,
            end_time: formData.endDate,
            status: formData.status,
            location_text: formData.location,
            application_deadline: formData.applicationDeadline,
            max_applicants: formData.maxApplicants
          })
          .eq('id', gigId)
        
        if (updateError) throw updateError
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
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                gigId,
                publishNow: true
              }),
            })

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
            purpose={formData.purpose!}
            compType={formData.compType}
            compDetails={formData.compDetails || ''}
            onTitleChange={(value) => saveFormData({ title: value })}
            onDescriptionChange={(value) => saveFormData({ description: value })}
            onPurposeChange={(value) => saveFormData({ purpose: value })}
            onCompTypeChange={(value) => saveFormData({ compType: value })}
            onCompDetailsChange={(value) => saveFormData({ compDetails: value })}
            onNext={goToNextStep}
            isValid={validateBasicDetails()}
          />
        )
      
      case 'schedule':
        return (
          <LocationScheduleStep
            location={formData.location}
            startDate={formData.startDate}
            endDate={formData.endDate}
            applicationDeadline={formData.applicationDeadline}
            onLocationChange={(value) => saveFormData({ location: value })}
            onStartDateChange={(value) => saveFormData({ startDate: value })}
            onEndDateChange={(value) => saveFormData({ endDate: value })}
            onApplicationDeadlineChange={(value) => saveFormData({ applicationDeadline: value })}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            isValid={validateSchedule()}
            validationErrors={[]}
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
      
      case 'moodboard':
        return (
          <MoodboardStep
            gigId={tempGigId || 'temp'}
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Gig</h1>
          <p className="text-gray-600">Follow the steps below to create your gig and attract the right talent</p>
        </div>
        
        {/* Restore Prompt */}
        {showRestorePrompt && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">Unsaved Changes Detected</h3>
                <p className="text-sm text-blue-700 mt-1">
                  We found unsaved changes from a previous session. Would you like to restore them?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={restoreUnsavedData}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Restore Changes
                  </button>
                  <button
                    onClick={clearUnsavedData}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Start Fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Display */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
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