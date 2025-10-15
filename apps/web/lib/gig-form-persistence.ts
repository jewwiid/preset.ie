import { useCallback, useMemo } from 'react'
import { debounce } from 'lodash'

export type CompType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER'
export type BudgetType = 'hourly' | 'per_project' | 'per_day' | 'total'
export type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER'
export type StatusType = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED'
// =====================================================
// DEFINITIVE ROLE CATEGORIES (100+ items)
// =====================================================
// This type matches EXACTLY with database tables:
// - talent_categories (20 items)
// - contributor_categories (80 items)
// These are the ONLY valid values for exact matching
// =====================================================

export type RoleCategory =
  // 🎭 TALENT CATEGORIES (from talent_categories table)
  | 'Model'
  | 'Actor'
  | 'Actress'
  | 'Dancer'
  | 'Musician'
  | 'Singer'
  | 'Voice Actor'
  | 'Influencer'
  | 'Content Creator'
  | 'Performer'
  | 'Stunt Performer'
  | 'Extra/Background Actor'
  | 'Hand Model'
  | 'Fitness Model'
  | 'Commercial Model'
  | 'Fashion Model'
  | 'Plus-Size Model'
  | 'Child Model'
  | 'Teen Model'
  | 'Mature Model'

  // 📸 PHOTOGRAPHY & VIDEOGRAPHY
  | 'Photographer'
  | 'Videographer'
  | 'Cinematographer'
  | 'Drone Operator'
  | 'Camera Operator'
  | 'Steadicam Operator'
  | 'BTS Photographer'
  | 'Product Photographer'

  // 🎬 PRODUCTION & DIRECTION
  | 'Producer'
  | 'Director'
  | 'Creative Director'
  | 'Art Director'
  | 'Production Manager'
  | 'Production Assistant'
  | 'First AD'
  | 'Second AD'
  | 'Script Supervisor'
  | 'Location Manager'

  // 💄 STYLING & BEAUTY
  | 'Makeup Artist'
  | 'Hair Stylist'
  | 'Fashion Stylist'
  | 'Wardrobe Stylist'
  | 'Costume Designer'
  | 'Grooming Artist'
  | 'Special Effects Makeup'
  | 'Nail Artist'

  // 🎨 POST-PRODUCTION
  | 'Editor'
  | 'Video Editor'
  | 'Photo Editor'
  | 'Retoucher'
  | 'Color Grader'
  | 'Colorist'
  | 'VFX Artist'
  | 'Motion Graphics Designer'
  | 'Animator'
  | 'Compositor'
  | 'Sound Designer'
  | 'Sound Engineer'

  // 🎨 DESIGN & CREATIVE
  | 'Graphic Designer'
  | 'UI/UX Designer'
  | 'Web Designer'
  | 'Illustrator'
  | '3D Artist'
  | 'Set Designer'
  | 'Prop Master'
  | 'Production Designer'
  | 'Visual Designer'
  | 'Brand Designer'

  // 🎥 LIGHTING & GRIP
  | 'Gaffer'
  | 'Key Grip'
  | 'Best Boy Electric'
  | 'Best Boy Grip'
  | 'Lighting Technician'
  | 'Grip'

  // 📱 DIGITAL & SOCIAL
  | 'Social Media Manager'
  | 'Digital Marketer'
  | 'Copywriter'
  | 'Scriptwriter'
  | 'Writer'
  | 'Blogger'
  | 'Journalist'

  // 💼 BUSINESS & MANAGEMENT
  | 'Agent'
  | 'Casting Director'
  | 'Talent Manager'
  | 'Brand Manager'
  | 'Marketing Manager'
  | 'Public Relations'
  | 'Event Coordinator'
  | 'Studio Manager'

  // 🎵 AUDIO
  | 'Music Producer'
  | 'DJ'
  | 'Boom Operator'
  | 'Audio Engineer'
  | 'Foley Artist'

  // 🔧 TECHNICAL
  | 'DIT'
  | 'Data Wrangler'
  | 'Playback Operator'
  | 'Technical Director'
  | 'Systems Engineer'

// Legacy type alias for backward compatibility
export type LookingForType = RoleCategory

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
  lookingFor?: RoleCategory[]  // Updated: now using RoleCategory (exact database match)
  purpose?: PurposeType
  compType: CompType
  compDetails?: string
  budgetMin?: number | null
  budgetMax?: number | null
  budgetType?: BudgetType
  usageRights: string
  location: string
  city?: string
  country?: string
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
  
  // Save form data to localStorage with error handling
  const saveGigData = useCallback((data: Partial<GigFormData>) => {
    try {
      // Check localStorage quota before saving
      const testKey = 'preset-quota-check'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      
      const existing = getGigData()
      const updated = {
        ...existing,
        ...data,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(updated))
      
      // Log successful save in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Form data saved successfully:', storageKey)
      }
    } catch (error) {
      console.warn('❌ Failed to save gig form data:', error)
      // Don't crash the app, just skip auto-save
      // This prevents localStorage issues from affecting auth
    }
  }, [storageKey])

  // Debounced save function - increased delay to reduce localStorage conflicts
  const debouncedSaveGigData = useMemo(
    () => debounce(saveGigData, 3000), // Increased from 1000ms to 3000ms
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