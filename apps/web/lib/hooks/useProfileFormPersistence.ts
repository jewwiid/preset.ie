import { useState, useCallback, useEffect } from 'react'
import { ProfileEditStep } from '../../app/components/profile-edit-steps/StepIndicator'
import { ProfileFormData } from '../profile-validation'

interface SavedProfileData {
  formData: ProfileFormData
  currentStep: ProfileEditStep
  completedSteps: ProfileEditStep[]
  lastSaved: string
}

export function useProfileFormPersistence(profileHandle: string) {
  const storageKey = `profile-edit-${profileHandle}`
  const [hasUnsavedData, setHasUnsavedData] = useState(false)

  // Save form data to localStorage
  const saveProfileData = useCallback((data: ProfileFormData) => {
    try {
      const savedData: SavedProfileData = {
        formData: data,
        currentStep: 'basic',
        completedSteps: [],
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(savedData))
      setHasUnsavedData(true)
    } catch (error) {
      console.error('Failed to save profile data:', error)
    }
  }, [storageKey])

  // Save current step
  const saveCurrentStep = useCallback((step: ProfileEditStep) => {
    try {
      const existing = localStorage.getItem(storageKey)
      if (existing) {
        const savedData: SavedProfileData = JSON.parse(existing)
        savedData.currentStep = step
        savedData.lastSaved = new Date().toISOString()
        localStorage.setItem(storageKey, JSON.stringify(savedData))
      }
    } catch (error) {
      console.error('Failed to save current step:', error)
    }
  }, [storageKey])

  // Save completed steps
  const saveCompletedSteps = useCallback((steps: ProfileEditStep[]) => {
    try {
      const existing = localStorage.getItem(storageKey)
      if (existing) {
        const savedData: SavedProfileData = JSON.parse(existing)
        savedData.completedSteps = steps
        savedData.lastSaved = new Date().toISOString()
        localStorage.setItem(storageKey, JSON.stringify(savedData))
      }
    } catch (error) {
      console.error('Failed to save completed steps:', error)
    }
  }, [storageKey])

  // Get saved form data
  const getProfileData = useCallback((): ProfileFormData => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const savedData: SavedProfileData = JSON.parse(saved)
        return savedData.formData || {}
      }
    } catch (error) {
      console.error('Failed to get profile data:', error)
    }
    return {}
  }, [storageKey])

  // Get current step
  const getCurrentStep = useCallback((): ProfileEditStep => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const savedData: SavedProfileData = JSON.parse(saved)
        return savedData.currentStep || 'basic'
      }
    } catch (error) {
      console.error('Failed to get current step:', error)
    }
    return 'basic'
  }, [storageKey])

  // Get completed steps
  const getCompletedSteps = useCallback((): ProfileEditStep[] => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const savedData: SavedProfileData = JSON.parse(saved)
        return savedData.completedSteps || []
      }
    } catch (error) {
      console.error('Failed to get completed steps:', error)
    }
    return []
  }, [storageKey])

  // Clear all saved data
  const clearProfileData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setHasUnsavedData(false)
    } catch (error) {
      console.error('Failed to clear profile data:', error)
    }
  }, [storageKey])

  // Debounced save function
  const debouncedSaveProfileData = useCallback(
    debounce((data: ProfileFormData) => {
      saveProfileData(data)
    }, 1000),
    [saveProfileData]
  )

  // Check if there's saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const savedData: SavedProfileData = JSON.parse(saved)
        setHasUnsavedData(!!savedData.formData && Object.keys(savedData.formData).length > 0)
      } catch (error) {
        console.error('Failed to parse saved profile data:', error)
      }
    }
  }, [storageKey])

  return {
    saveProfileData,
    debouncedSaveProfileData,
    getProfileData,
    saveCurrentStep,
    getCurrentStep,
    saveCompletedSteps,
    getCompletedSteps,
    clearProfileData,
    hasUnsavedData
  }
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
