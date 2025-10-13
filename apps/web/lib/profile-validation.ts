export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ProfileFormData {
  // Basic fields
  display_name?: string
  handle?: string
  bio?: string
  city?: string
  country?: string
  
  // Professional fields
  years_experience?: number
  languages?: string[]
  specializations?: string[]
  equipment_list?: string[]
  editing_software?: string[]
  professional_skills?: string[]
  contributor_roles?: string[]
  performance_roles?: string[]
  experience_level?: string
  
  // Contact fields
  instagram_handle?: string
  tiktok_handle?: string
  website_url?: string
  portfolio_url?: string
  behance_url?: string
  dribbble_url?: string
  phone_number?: string
  
  // Availability fields
  availability_status?: string
  hourly_rate_min?: number
  hourly_rate_max?: number
  available_for_travel?: boolean
  travel_radius_km?: number
  has_studio?: boolean
  studio_name?: string
  available_weekdays?: boolean
  available_weekends?: boolean
  available_evenings?: boolean
  available_overnight?: boolean
  accepts_tfp?: boolean
  accepts_expenses_only?: boolean
  allow_direct_booking?: boolean
  
  // Image fields
  avatar_url?: string
  header_banner_url?: string
  header_banner_position?: string
  
  // Privacy/Visibility fields
  show_experience?: boolean
  show_specializations?: boolean
  show_equipment?: boolean
  show_social_links?: boolean
  show_website?: boolean
  show_phone?: boolean
  phone_public?: boolean
  email_public?: boolean
  show_rates?: boolean
  show_availability?: boolean
}

export function validateProfileStep(step: string, data: ProfileFormData): ValidationResult {
  const errors: string[] = []

  switch (step) {
    case 'basic':
      if (!data.display_name?.trim()) {
        errors.push('Display name is required')
      } else if (data.display_name.length < 2) {
        errors.push('Display name must be at least 2 characters')
      } else if (data.display_name.length > 255) {
        errors.push('Display name must be less than 255 characters')
      }

      if (!data.handle?.trim()) {
        errors.push('Handle is required')
      } else if (!/^[a-z0-9_]{3,30}$/.test(data.handle)) {
        errors.push('Handle must be 3-30 characters, lowercase letters, numbers, and underscores only')
      }

      if (data.bio && data.bio.length > 1000) {
        errors.push('Bio must be less than 1000 characters')
      }

      if (data.city && data.city.length > 255) {
        errors.push('City must be less than 255 characters')
      }

      if (data.country && data.country.length > 255) {
        errors.push('Country must be less than 255 characters')
      }
      break

    case 'professional':
      if (data.years_experience !== undefined && data.years_experience < 0) {
        errors.push('Years of experience cannot be negative')
      }

      if (data.years_experience !== undefined && data.years_experience > 100) {
        errors.push('Years of experience cannot exceed 100')
      }

      if (data.languages && data.languages.length > 20) {
        errors.push('Cannot have more than 20 languages')
      }

      if (data.specializations && data.specializations.length > 20) {
        errors.push('Cannot have more than 20 specializations')
      }

      if (data.equipment_list && data.equipment_list.length > 50) {
        errors.push('Cannot have more than 50 equipment items')
      }

      if (data.editing_software && data.editing_software.length > 20) {
        errors.push('Cannot have more than 20 editing software items')
      }

      if (data.professional_skills && data.professional_skills.length > 30) {
        errors.push('Cannot have more than 30 professional skills')
      }

      if (data.contributor_roles && data.contributor_roles.length > 20) {
        errors.push('Cannot have more than 20 contributor roles')
      }

      if (data.performance_roles && data.performance_roles.length > 20) {
        errors.push('Cannot have more than 20 performance roles')
      }
      break

    case 'contact':
      if (data.instagram_handle && !/^[a-zA-Z0-9._]{1,30}$/.test(data.instagram_handle)) {
        errors.push('Instagram handle must be 1-30 characters, letters, numbers, dots, and underscores only')
      }

      if (data.tiktok_handle && !/^[a-zA-Z0-9._]{1,30}$/.test(data.tiktok_handle)) {
        errors.push('TikTok handle must be 1-30 characters, letters, numbers, dots, and underscores only')
      }

      if (data.website_url && !isValidUrl(data.website_url)) {
        errors.push('Website URL must be a valid URL')
      }

      if (data.portfolio_url && !isValidUrl(data.portfolio_url)) {
        errors.push('Portfolio URL must be a valid URL')
      }

      if (data.behance_url && !isValidUrl(data.behance_url)) {
        errors.push('Behance URL must be a valid URL')
      }

      if (data.dribbble_url && !isValidUrl(data.dribbble_url)) {
        errors.push('Dribbble URL must be a valid URL')
      }

      if (data.phone_number && !isValidPhone(data.phone_number)) {
        errors.push('Phone number must be a valid format')
      }
      break

    case 'availability':
      const validStatuses = ['available', 'limited', 'busy', 'unavailable']
      if (data.availability_status && !validStatuses.includes(data.availability_status)) {
        errors.push('Invalid availability status')
      }

      if (data.hourly_rate_min !== undefined && data.hourly_rate_min < 0) {
        errors.push('Minimum hourly rate cannot be negative')
      }

      if (data.hourly_rate_max !== undefined && data.hourly_rate_max < 0) {
        errors.push('Maximum hourly rate cannot be negative')
      }

      if (data.hourly_rate_min !== undefined && data.hourly_rate_max !== undefined && 
          data.hourly_rate_min > data.hourly_rate_max) {
        errors.push('Minimum hourly rate cannot be greater than maximum rate')
      }

      if (data.travel_radius_km !== undefined && data.travel_radius_km < 0) {
        errors.push('Travel radius cannot be negative')
      }

      if (data.travel_radius_km !== undefined && data.travel_radius_km > 10000) {
        errors.push('Travel radius cannot exceed 10,000 km')
      }

      if (data.studio_name && data.studio_name.length > 255) {
        errors.push('Studio name must be less than 255 characters')
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateHandleFormat(handle: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(handle)
}

export function validateHandleAvailability(handle: string, currentHandle: string): Promise<boolean> {
  if (handle === currentHandle) {
    return Promise.resolve(true)
  }

  return fetch(`/api/users/${handle}/redirect`, {
    method: 'GET'
  })
    .then(response => response.json())
    .then(data => !data.redirect && data.current_handle === handle)
    .catch(() => false)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - allows international formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export function validateAllSteps(data: ProfileFormData): ValidationResult {
  const allErrors: string[] = []
  
  const basicResult = validateProfileStep('basic', data)
  const professionalResult = validateProfileStep('professional', data)
  const contactResult = validateProfileStep('contact', data)
  const availabilityResult = validateProfileStep('availability', data)
  
  allErrors.push(...basicResult.errors, ...professionalResult.errors, ...contactResult.errors, ...availabilityResult.errors)
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}
