'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import { supabase } from '../../../../lib/supabase'
import { useGigFormPersistence, CompType, PurposeType, StatusType } from '../../../../lib/gig-form-persistence'
import { CheckCircle2, X } from 'lucide-react'

// Step Components
import StepIndicator, { GigEditStep } from '../../../components/gig-edit-steps/StepIndicator'
import BasicDetailsStep from '../../../components/gig-edit-steps/BasicDetailsStep'
import LocationScheduleStep from '../../../components/gig-edit-steps/LocationScheduleStep'
import RequirementsStep from '../../../components/gig-edit-steps/RequirementsStep'
import MoodboardStep from '../../../components/gig-edit-steps/MoodboardStep'
import ReviewPublishStep from '../../../components/gig-edit-steps/ReviewPublishStep'

interface GigDetails {
  id: string
  title: string
  description: string
  purpose?: PurposeType
  comp_type: CompType
  usage_rights: string
  location_text: string
  start_time: string
  end_time: string
  application_deadline: string
  max_applicants: number
  status: StatusType
  owner_user_id: string
}

export default function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const resolvedParams = use(params)
  const gigId = resolvedParams.id
  
  // Form persistence
  const { 
    saveGigData, 
    debouncedSaveGigData, 
    getGigData, 
    saveCurrentStep, 
    getCurrentStep,
    saveCompletedSteps,
    getCompletedSteps,
    clearGigData,
    hasUnsavedData 
  } = useGigFormPersistence(gigId)
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<GigEditStep>('basic')
  const [completedSteps, setCompletedSteps] = useState<GigEditStep[]>([])
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  
  // Page state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [applicationCount, setApplicationCount] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [purpose, setPurpose] = useState<PurposeType>('PORTFOLIO')
  const [compType, setCompType] = useState<CompType>('TFP')
  const [compDetails, setCompDetails] = useState('')
  const [usageRights, setUsageRights] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [maxApplicants, setMaxApplicants] = useState(10)
  const [safetyNotes, setSafetyNotes] = useState('')
  const [status, setStatus] = useState<StatusType>('DRAFT')
  const [moodboardId, setMoodboardId] = useState<string | null>(null)
  
  // Warnings
  const [warnings, setWarnings] = useState<string[]>([])
  
  // Initialize form with saved data on mount - but only after gig data is loaded
  useEffect(() => {
    // Only check for saved data if we're not in loading state (meaning gig data has been fetched)
    if (!loading) {
      const savedData = getGigData()
      const savedStep = getCurrentStep() as GigEditStep
      const savedCompleted = getCompletedSteps() as GigEditStep[]
      
      if (Object.keys(savedData).length > 1) { // More than just lastSaved
        setShowRestorePrompt(true)
      }
      
      // Set completed steps only if no database-derived completed steps exist
      if (completedSteps.length === 0) {
        setCompletedSteps(savedCompleted)
      }
    }
  }, [loading, getGigData, getCurrentStep, getCompletedSteps, completedSteps.length])
  
  // Auto-save form data whenever it changes
  useEffect(() => {
    const formData = {
      title,
      description,
      purpose,
      compType,
      usageRights,
      location,
      startDate,
      endDate,
      applicationDeadline,
      maxApplicants,
      status,
      moodboardId: moodboardId || undefined
    }
    
    // Only save if we have meaningful data and user is owner
    if (isOwner && (title || description || location || moodboardId)) {
      debouncedSaveGigData(formData)
    }
  }, [title, description, purpose, compType, usageRights, location, startDate, endDate, 
      applicationDeadline, maxApplicants, status, moodboardId, debouncedSaveGigData, isOwner])
  
  // Auto-save current step
  useEffect(() => {
    if (isOwner) {
      saveCurrentStep(currentStep)
    }
  }, [currentStep, saveCurrentStep, isOwner])
  
  // Auto-save completed steps
  useEffect(() => {
    if (isOwner) {
      saveCompletedSteps(completedSteps)
    }
  }, [completedSteps, saveCompletedSteps, isOwner])
  
  useEffect(() => {
    if (user) {
      fetchGigDetails()
    } else {
      router.push('/auth/signin')
    }
  }, [gigId, user])
  
  // Function to detect which steps are completed based on gig data
  const detectCompletedSteps = useCallback((gig: any): GigEditStep[] => {
    const completed: GigEditStep[] = []
    
    // Basic step: Check if title and description exist
    if (gig?.title && gig?.description) {
      completed.push('basic')
    }
    
    // Schedule step: Check if start_time and end_time exist
    if (gig?.start_time && gig?.end_time && gig?.location_text) {
      completed.push('schedule')
    }
    
    // Requirements step: Check if comp_type and usage_rights exist
    if (gig?.comp_type && gig?.usage_rights) {
      completed.push('requirements')
    }
    
    // Moodboard step is always considered completed (it's optional)
    completed.push('moodboard')
    
    return completed
  }, [])
  
  const fetchGigDetails = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      // Get gig details
      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('id', gigId)
        .single()
      
      if (gigError) throw gigError
      
      // Check if user is the owner
      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user!.id)
        .single()
      
      if (!profile || profile.id !== gig.owner_user_id) {
        setError('You are not authorized to edit this gig')
        setIsOwner(false)
        return
      }
      
      setIsOwner(true)
      
      // Get application count
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('gig_id', gigId)
      
      setApplicationCount(count || 0)
      
      // Fetch existing moodboard
      const { data: moodboards } = await supabase
        .from('moodboards')
        .select('id')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false })
        .limit(1)
      
      const moodboard = moodboards?.[0] || null
      
      if (moodboard) {
        setMoodboardId(moodboard.id)
      }
      
      // Populate form fields
      setTitle(gig.title)
      setDescription(gig.description || '')
      setPurpose(gig.purpose || 'PORTFOLIO')
      setCompType(gig.comp_type)
      setUsageRights(gig.usage_rights || '')
      setLocation(gig.location_text || '')
      setStatus(gig.status)
      setMaxApplicants(gig.max_applicants || 10)
      
      // Format dates for input fields
      if (gig.start_time) {
        setStartDate(new Date(gig.start_time).toISOString().slice(0, 16))
      }
      if (gig.end_time) {
        setEndDate(new Date(gig.end_time).toISOString().slice(0, 16))
      }
      if (gig.application_deadline) {
        setApplicationDeadline(new Date(gig.application_deadline).toISOString().slice(0, 16))
      }
      
      // Check for warnings
      const newWarnings = []
      const now = new Date()
      const deadline = new Date(gig.application_deadline)
      
      if (deadline < now && applicationCount > 0) {
        newWarnings.push(`Applications are closed (deadline was ${deadline.toLocaleDateString()}). ${applicationCount} applications received.`)
      }
      
      if (gig.status === 'PUBLISHED' && applicationCount > 0) {
        newWarnings.push(`This gig has ${applicationCount} active applications. Changes will affect all applicants.`)
      }
      
      setWarnings(newWarnings)
      
      // Detect and set completed steps based on existing data
      const completed = detectCompletedSteps(gig)
      setCompletedSteps(completed)
      
    } catch (err: any) {
      console.error('Error fetching gig:', err)
      setError(err.message || 'Failed to load gig')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOwner) {
      setError('You are not authorized to edit this gig')
      return
    }
    
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Validate dates
      const startDateTime = new Date(startDate)
      const endDateTime = new Date(endDate)
      const deadlineDateTime = new Date(applicationDeadline)
      
      if (endDateTime <= startDateTime) {
        setError('End time must be after start time')
        setSaving(false)
        return
      }
      
      if (deadlineDateTime >= startDateTime) {
        setError('Application deadline must be before the gig starts')
        setSaving(false)
        return
      }
      
      // Check if we're extending the deadline after it has passed
      const now = new Date()
      const originalDeadline = new Date(applicationDeadline)
      
      if (originalDeadline < now && deadlineDateTime > now && applicationCount > 0) {
        if (!confirm(`You're reopening applications after the deadline has passed. This will allow new applications. Continue?`)) {
          setSaving(false)
          return
        }
      }
      
      if (!supabase) {
        console.error('Supabase client not available')
        setSaving(false)
        return
      }

      // Update the gig
      const { error: updateError } = await supabase
        .from('gigs')
        .update({
          title,
          description,
          purpose,
          comp_type: compType,
          usage_rights: usageRights,
          location_text: location,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          application_deadline: deadlineDateTime.toISOString(),
          max_applicants: maxApplicants,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId)
      
      if (updateError) throw updateError
      
      setSuccess('Gig updated successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/gigs/${gigId}`)
      }, 1500)
      
    } catch (err: any) {
      console.error('Error updating gig:', err)
      setError(err.message || 'Failed to update gig')
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
      return
    }
    
    if (applicationCount > 0) {
      if (!confirm(`This gig has ${applicationCount} applications. Deleting it will remove all applications. Continue?`)) {
        return
      }
    }
    
    try {
      setSaving(true)
      
      if (!supabase) {
        console.error('Supabase client not available')
        setSaving(false)
        return
      }

      const { error: deleteError } = await supabase
        .from('gigs')
        .delete()
        .eq('id', gigId)
      
      if (deleteError) throw deleteError
      
      clearGigData()
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error deleting gig:', err)
      setError(err.message || 'Failed to delete gig')
      setSaving(false)
    }
  }

  // Wizard navigation functions
  const handleNextStep = () => {
    const currentStepIndex = steps.indexOf(currentStep)
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1]
      setCurrentStep(nextStep)
      
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
    }
  }

  const handleBackStep = () => {
    const currentStepIndex = steps.indexOf(currentStep)
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1]
      setCurrentStep(prevStep)
    }
  }

  const handleStepClick = (step: GigEditStep) => {
    // Only allow clicking on completed steps or the current step
    const stepIndex = steps.indexOf(step)
    const currentIndex = steps.indexOf(currentStep)
    const isCompleted = completedSteps.includes(step)
    
    if (isCompleted || stepIndex <= currentIndex) {
      setCurrentStep(step)
    }
  }

  const handleMoodboardSave = (newMoodboardId: string) => {
    setMoodboardId(newMoodboardId)
  }

  const handleRestoreSavedData = () => {
    const savedData = getGigData()
    const savedStep = getCurrentStep() as GigEditStep
    
    // Restore form data
    if (savedData.title) setTitle(savedData.title)
    if (savedData.description) setDescription(savedData.description)
    if (savedData.purpose) setPurpose(savedData.purpose)
    if (savedData.compType) setCompType(savedData.compType)
    if (savedData.usageRights) setUsageRights(savedData.usageRights)
    if (savedData.location) setLocation(savedData.location)
    if (savedData.startDate) setStartDate(savedData.startDate)
    if (savedData.endDate) setEndDate(savedData.endDate)
    if (savedData.applicationDeadline) setApplicationDeadline(savedData.applicationDeadline)
    if (savedData.maxApplicants) setMaxApplicants(savedData.maxApplicants)
    if (savedData.status) setStatus(savedData.status)
    if (savedData.moodboardId) setMoodboardId(savedData.moodboardId)
    
    // Restore wizard step
    if (savedStep && steps.includes(savedStep)) {
      setCurrentStep(savedStep)
    }
    
    setShowRestorePrompt(false)
  }

  const handleDiscardSavedData = () => {
    clearGigData()
    setShowRestorePrompt(false)
  }

  // Step definitions
  const steps: GigEditStep[] = ['basic', 'schedule', 'requirements', 'moodboard', 'review']

  // Validation functions
  const isBasicStepValid = (): boolean => {
    return Boolean(title.trim() !== '' && description.trim() !== '' && purpose && compType)
  }

  const isLocationStepValid = (): boolean => {
    return Boolean(location.trim() !== '' && startDate && endDate && applicationDeadline)
  }

  const getLocationValidationErrors = () => {
    const errors: string[] = []
    
    if (!location.trim()) errors.push('Location is required')
    if (!startDate) errors.push('Start date is required')
    if (!endDate) errors.push('End date is required')
    if (!applicationDeadline) errors.push('Application deadline is required')
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) errors.push('End time must be after start time')
    }
    
    if (applicationDeadline && startDate) {
      const deadline = new Date(applicationDeadline)
      const start = new Date(startDate)
      if (deadline >= start) errors.push('Application deadline must be before the gig starts')
    }
    
    return errors
  }

  const isRequirementsStepValid = () => {
    return usageRights.trim() !== '' && maxApplicants >= 1
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
  
  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h2>
          <p className="text-gray-600 mb-4">{error || 'You cannot edit this gig.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Restore prompt */}
        {showRestorePrompt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Unsaved Changes Found
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  You have unsaved changes from a previous editing session. Would you like to restore them?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreSavedData}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Restore Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardSavedData}
                    className="px-3 py-1 bg-white border border-blue-300 text-blue-700 text-xs rounded hover:bg-blue-50 transition-colors"
                  >
                    Discard & Start Fresh
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRestorePrompt(false)}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Gig</h1>
              <p className="text-gray-600 text-sm mt-1">Update your gig details step by step</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {status}
              </span>
              {applicationCount > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {applicationCount} applications
                </span>
              )}
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Global Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'basic' && (
          <BasicDetailsStep
            title={title}
            description={description}
            purpose={purpose}
            compType={compType}
            compDetails={compDetails}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onPurposeChange={setPurpose}
            onCompTypeChange={setCompType}
            onCompDetailsChange={setCompDetails}
            onNext={handleNextStep}
            isValid={isBasicStepValid()}
          />
        )}

        {currentStep === 'schedule' && (
          <LocationScheduleStep
            location={location}
            startDate={startDate}
            endDate={endDate}
            applicationDeadline={applicationDeadline}
            onLocationChange={setLocation}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onApplicationDeadlineChange={setApplicationDeadline}
            onNext={handleNextStep}
            onBack={handleBackStep}
            isValid={isLocationStepValid()}
            validationErrors={getLocationValidationErrors()}
          />
        )}

        {currentStep === 'requirements' && (
          <RequirementsStep
            usageRights={usageRights}
            maxApplicants={maxApplicants}
            safetyNotes={safetyNotes}
            onUsageRightsChange={setUsageRights}
            onMaxApplicantsChange={setMaxApplicants}
            onSafetyNotesChange={setSafetyNotes}
            onNext={handleNextStep}
            onBack={handleBackStep}
            isValid={isRequirementsStepValid()}
            applicationCount={applicationCount}
          />
        )}

        {currentStep === 'moodboard' && (
          <MoodboardStep
            gigId={gigId}
            moodboardId={moodboardId || undefined}
            onMoodboardSave={handleMoodboardSave}
            onNext={handleNextStep}
            onBack={handleBackStep}
          />
        )}

        {currentStep === 'review' && (
          <ReviewPublishStep
            title={title}
            description={description}
            purpose={purpose}
            compType={compType}
            compDetails={compDetails}
            location={location}
            startDate={startDate}
            endDate={endDate}
            applicationDeadline={applicationDeadline}
            usageRights={usageRights}
            maxApplicants={maxApplicants}
            safetyNotes={safetyNotes}
            status={status}
            moodboardId={moodboardId || undefined}
            onStatusChange={setStatus}
            onBack={handleBackStep}
            onSave={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            saving={saving}
            applicationCount={applicationCount}
            warnings={warnings}
          />
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/gigs/${gigId}`)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete Gig
              </button>
            </div>
            
            {hasUnsavedData() && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                Auto-saving changes...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}