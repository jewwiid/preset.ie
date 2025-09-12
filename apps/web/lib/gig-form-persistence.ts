import { useCallback, useMemo } from 'react'
import { debounce } from 'lodash'

export type CompType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER'
export type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER'
export type StatusType = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED'

export interface GigFormData {
  title: string
  description: string
  purpose?: PurposeType
  compType: CompType
  usageRights: string
  location: string
  startDate: string
  endDate: string
  applicationDeadline: string
  maxApplicants: number
  status: StatusType
  moodboardId?: string
  lastSaved?: string
}

export function useGigFormPersistence(gigId: string) {
  const storageKey = `gig-edit-${gigId}`
  
  // Save form data to localStorage
  const saveGigData = useCallback((data: Partial<GigFormData>) => {
    try {
      const existing = getGigData()
      const updated = {
        ...existing,
        ...data,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save gig form data:', error)
    }
  }, [storageKey])

  // Debounced save function
  const debouncedSaveGigData = useMemo(
    () => debounce(saveGigData, 1000),
    [saveGigData]
  )

  // Get form data from localStorage
  const getGigData = useCallback((): Partial<GigFormData> => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.warn('Failed to load gig form data:', error)
      return {}
    }
  }, [storageKey])

  // Save current step
  const saveCurrentStep = useCallback((step: string) => {
    try {
      localStorage.setItem(`${storageKey}-step`, step)
    } catch (error) {
      console.warn('Failed to save current step:', error)
    }
  }, [storageKey])

  // Get current step
  const getCurrentStep = useCallback((): string => {
    try {
      return localStorage.getItem(`${storageKey}-step`) || 'basic'
    } catch (error) {
      console.warn('Failed to load current step:', error)
      return 'basic'
    }
  }, [storageKey])

  // Save completed steps
  const saveCompletedSteps = useCallback((steps: string[]) => {
    try {
      localStorage.setItem(`${storageKey}-completed`, JSON.stringify(steps))
    } catch (error) {
      console.warn('Failed to save completed steps:', error)
    }
  }, [storageKey])

  // Get completed steps
  const getCompletedSteps = useCallback((): string[] => {
    try {
      const saved = localStorage.getItem(`${storageKey}-completed`)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.warn('Failed to load completed steps:', error)
      return []
    }
  }, [storageKey])

  // Clear all saved data
  const clearGigData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`${storageKey}-step`)
      localStorage.removeItem(`${storageKey}-completed`)
    } catch (error) {
      console.warn('Failed to clear gig form data:', error)
    }
  }, [storageKey])

  // Check if there's unsaved data
  const hasUnsavedData = useCallback((): boolean => {
    const data = getGigData()
    return Object.keys(data).length > 1 // More than just lastSaved
  }, [getGigData])

  return {
    saveGigData,
    debouncedSaveGigData,
    getGigData,
    saveCurrentStep,
    getCurrentStep,
    saveCompletedSteps,
    getCompletedSteps,
    clearGigData,
    hasUnsavedData
  }
}