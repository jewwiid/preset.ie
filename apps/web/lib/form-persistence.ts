/**
 * Form Persistence Utilities
 * Handles saving and restoring form data during multi-step processes
 */

const STORAGE_KEYS = {
  SIGNUP_FORM: 'preset_signup_form_data',
  SIGNUP_STEP: 'preset_signup_current_step',
  PROFILE_SETUP: 'preset_profile_setup_data'
} as const

export interface SignupFormData {
  // Step 1: Role Selection
  selectedRole?: 'CONTRIBUTOR' | 'TALENT' | 'BOTH'
  
  // Step 2: Credentials
  email?: string
  password?: string
  confirmPassword?: string
  dateOfBirth?: string // ISO string
  agreedToTerms?: boolean
  
  // Step 3: Profile Info
  displayName?: string
  handle?: string
  bio?: string
  city?: string
  country?: string
  
  // Step 4: Styles & Vibes
  selectedStyles?: string[]
  selectedVibes?: string[]
  
  // Profile Setup Data (from ProfileSetupForm)
  profileData?: any
  
  // Timestamps for cleanup
  lastSaved?: number
}

export class FormPersistence {
  private static CLEANUP_DAYS = 7 // Clean up data older than 7 days
  
  /**
   * Save signup form data to localStorage
   */
  static saveSignupData(data: Partial<SignupFormData>): void {
    try {
      const existing = FormPersistence.getSignupData()
      const updated = {
        ...existing,
        ...data,
        lastSaved: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.SIGNUP_FORM, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save signup data:', error)
    }
  }
  
  /**
   * Get saved signup form data from localStorage
   */
  static getSignupData(): SignupFormData {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIGNUP_FORM)
      if (!saved) return {}
      
      const data = JSON.parse(saved) as SignupFormData
      
      // Clean up old data
      if (data.lastSaved && Date.now() - data.lastSaved > FormPersistence.CLEANUP_DAYS * 24 * 60 * 60 * 1000) {
        FormPersistence.clearSignupData()
        return {}
      }
      
      return data
    } catch (error) {
      console.warn('Failed to load signup data:', error)
      return {}
    }
  }
  
  /**
   * Save current signup step
   */
  static saveCurrentStep(step: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SIGNUP_STEP, step)
    } catch (error) {
      console.warn('Failed to save current step:', error)
    }
  }
  
  /**
   * Get current signup step
   */
  static getCurrentStep(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIGNUP_STEP)
    } catch (error) {
      console.warn('Failed to load current step:', error)
      return null
    }
  }
  
  /**
   * Clear all signup data (call after successful signup)
   */
  static clearSignupData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SIGNUP_FORM)
      localStorage.removeItem(STORAGE_KEYS.SIGNUP_STEP)
    } catch (error) {
      console.warn('Failed to clear signup data:', error)
    }
  }
  
  /**
   * Save profile setup data
   */
  static saveProfileData(data: any): void {
    try {
      // Handle file objects by converting to base64
      const processedData = { ...data }
      
      // Convert avatar file to base64 if it exists
      if (data.avatarFile && data.avatarFile instanceof File) {
        // We'll handle file conversion in the component using FileReader
        processedData.avatarFile = null // Don't save file object directly
      }
      
      const updated = {
        ...processedData,
        lastSaved: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.PROFILE_SETUP, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save profile data:', error)
    }
  }
  
  /**
   * Get saved profile setup data
   */
  static getProfileData(): any {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_SETUP)
      if (!saved) return {}
      
      const data = JSON.parse(saved)
      
      // Clean up old data
      if (data.lastSaved && Date.now() - data.lastSaved > FormPersistence.CLEANUP_DAYS * 24 * 60 * 60 * 1000) {
        FormPersistence.clearProfileData()
        return {}
      }
      
      return data
    } catch (error) {
      console.warn('Failed to load profile data:', error)
      return {}
    }
  }
  
  /**
   * Clear profile setup data (call after successful completion)
   */
  static clearProfileData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE_SETUP)
    } catch (error) {
      console.warn('Failed to clear profile data:', error)
    }
  }
  
  /**
   * Check if user has saved form data (for showing restore prompts)
   */
  static hasSavedSignupData(): boolean {
    const data = FormPersistence.getSignupData()
    return Object.keys(data).length > 1 // More than just lastSaved
  }
  
  /**
   * Debounced save function to avoid excessive localStorage writes
   */
  static debouncedSaveSignupData = FormPersistence.debounce((data: Partial<SignupFormData>) => {
    FormPersistence.saveSignupData(data)
  }, 500)
  
  private static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }
}

/**
 * Hook for using form persistence in React components
 */
export function useFormPersistence() {
  return {
    saveSignupData: FormPersistence.saveSignupData,
    getSignupData: FormPersistence.getSignupData,
    saveCurrentStep: FormPersistence.saveCurrentStep,
    getCurrentStep: FormPersistence.getCurrentStep,
    clearSignupData: FormPersistence.clearSignupData,
    saveProfileData: FormPersistence.saveProfileData,
    getProfileData: FormPersistence.getProfileData,
    clearProfileData: FormPersistence.clearProfileData,
    hasSavedSignupData: FormPersistence.hasSavedSignupData,
    debouncedSaveSignupData: FormPersistence.debouncedSaveSignupData
  }
}