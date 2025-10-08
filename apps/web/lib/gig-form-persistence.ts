import { useCallback, useMemo } from 'react'
import { debounce } from 'lodash'

export type CompType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER'
export type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER'
export type StatusType = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED'
export type LookingForType =
  // 🎭 Talent & Performers
  | 'MODELS'
  | 'MODELS_FASHION'
  | 'MODELS_COMMERCIAL'
  | 'MODELS_FITNESS'
  | 'MODELS_EDITORIAL'
  | 'MODELS_RUNWAY'
  | 'MODELS_HAND'
  | 'MODELS_PARTS'
  | 'ACTORS'
  | 'DANCERS'
  | 'MUSICIANS'
  | 'SINGERS'
  | 'VOICE_ACTORS'
  | 'PERFORMERS'
  | 'INFLUENCERS'

  // 📸 Visual Creators
  | 'PHOTOGRAPHERS'
  | 'VIDEOGRAPHERS'
  | 'CINEMATOGRAPHERS'

  // 🎬 Production & Crew
  | 'PRODUCTION_CREW'
  | 'PRODUCERS'
  | 'DIRECTORS'
  | 'CREATIVE_DIRECTORS'
  | 'ART_DIRECTORS'

  // 💄 Styling & Beauty
  | 'MAKEUP_ARTISTS'
  | 'HAIR_STYLISTS'
  | 'FASHION_STYLISTS'
  | 'WARDROBE_STYLISTS'

  // 🎨 Post-Production
  | 'EDITORS'
  | 'VIDEO_EDITORS'
  | 'PHOTO_EDITORS'
  | 'VFX_ARTISTS'
  | 'MOTION_GRAPHICS'
  | 'RETOUCHERS'
  | 'COLOR_GRADERS'

  // 🎨 Design & Creative
  | 'DESIGNERS'
  | 'GRAPHIC_DESIGNERS'
  | 'ILLUSTRATORS'
  | 'ANIMATORS'

  // 📱 Content & Social
  | 'CONTENT_CREATORS'
  | 'SOCIAL_MEDIA_MANAGERS'
  | 'DIGITAL_MARKETERS'

  // 💼 Business & Teams
  | 'AGENCIES'
  | 'BRAND_MANAGERS'
  | 'MARKETING_TEAMS'
  | 'STUDIOS'

  // ✍️ Writing
  | 'WRITERS'
  | 'COPYWRITERS'
  | 'SCRIPTWRITERS'

  // Other
  | 'OTHER'

export interface ApplicantPreferences {
  physical: {
    height_range: { min: number | null; max: number | null }
    measurements: { required: boolean; specific: string | null }
    eye_color: { required: boolean; preferred: string[] }
    hair_color: { required: boolean; preferred: string[] }
    tattoos: { allowed: boolean; required: boolean }
    piercings: { allowed: boolean; required: boolean }
    clothing_sizes: { required: boolean; preferred: string[] }
  }
  professional: {
    experience_years: { min: number | null; max: number | null }
    specializations: { required: string[]; preferred: string[] }
    equipment: { required: string[]; preferred: string[] }
    software: { required: string[]; preferred: string[] }
    talent_categories: { required: string[]; preferred: string[] }
    portfolio_required: boolean
  }
  availability: {
    travel_required: boolean
    travel_radius_km: number | null
    hourly_rate_range: { min: number | null; max: number | null }
  }
  other: {
    age_range: { min: number | null; max: number | null }
    languages: { required: string[]; preferred: string[] }
    additional_requirements: string
  }
}

export interface GigFormData {
  title: string
  description: string
  lookingFor?: LookingForType[]  // Changed to array for multi-select
  purpose?: PurposeType
  compType: CompType
  compDetails?: string
  usageRights: string
  location: string
  startDate: string
  endDate: string
  applicationDeadline: string
  maxApplicants: number
  safetyNotes?: string
  status: StatusType
  moodboardId?: string
  applicantPreferences?: ApplicantPreferences
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