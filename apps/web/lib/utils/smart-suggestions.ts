import { UserProfile } from '../types/dashboard'

// Profile field definitions with weights (same as ProfileCompletionCard)
interface ProfileField {
  key: keyof UserProfile
  label: string
  weight: number
  category: 'high' | 'medium' | 'low'
  applicableRoles?: ('CONTRIBUTOR' | 'TALENT' | 'BOTH')[]
}

const PROFILE_FIELDS: ProfileField[] = [
  // ============ UNIVERSAL FIELDS (Apply to ALL roles) ============
  // CRITICAL - Visual Identity
  { key: 'avatar_url', label: 'Profile Photo', weight: 15, category: 'high' },
  
  // High Impact - Basic Profile
  { key: 'bio', label: 'Bio', weight: 10, category: 'high' },
  { key: 'city', label: 'Location', weight: 8, category: 'high' },
  { key: 'country', label: 'Country', weight: 5, category: 'high' },
  
  // High Impact - Skills & Experience
  { key: 'specializations', label: 'Specializations', weight: 12, category: 'high' },
  { key: 'years_experience', label: 'Experience (Years)', weight: 10, category: 'high' },
  { key: 'experience_level', label: 'Experience Level', weight: 8, category: 'high' },
  
  // High Impact - Rates & Availability
  { key: 'hourly_rate_min', label: 'Hourly Rate', weight: 10, category: 'high' },
  { key: 'typical_turnaround_days', label: 'Turnaround Time', weight: 6, category: 'high' },
  { key: 'availability_status', label: 'Availability Status', weight: 5, category: 'high' },
  
  // Medium Impact - Contact & Portfolio
  { key: 'phone_number', label: 'Phone', weight: 5, category: 'medium' },
  { key: 'portfolio_url', label: 'Portfolio', weight: 8, category: 'medium' },
  { key: 'website_url', label: 'Website', weight: 5, category: 'medium' },
  { key: 'instagram_handle', label: 'Instagram', weight: 3, category: 'medium' },
  { key: 'tiktok_handle', label: 'TikTok', weight: 2, category: 'medium' },
  
  // Low Impact - Additional Info
  { key: 'available_for_travel', label: 'Travel Availability', weight: 4, category: 'low' },
  { key: 'languages', label: 'Languages', weight: 4, category: 'low' },
  
  // ============ CONTRIBUTOR-SPECIFIC FIELDS ============
  { key: 'equipment_list', label: 'Equipment', weight: 8, category: 'high', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  { key: 'editing_software', label: 'Software', weight: 6, category: 'medium', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  { key: 'studio_name', label: 'Studio Info', weight: 4, category: 'low', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  { key: 'has_studio', label: 'Has Studio', weight: 3, category: 'low', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  
  // ============ TALENT-SPECIFIC FIELDS ============
  { key: 'talent_categories', label: 'Talent Categories', weight: 10, category: 'high', applicableRoles: ['TALENT', 'BOTH'] },
  
  // Physical Attributes
  { key: 'height_cm', label: 'Height', weight: 6, category: 'medium', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'weight_kg', label: 'Weight', weight: 4, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'body_type', label: 'Body Type', weight: 4, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'eye_color', label: 'Eye Color', weight: 3, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'hair_color', label: 'Hair Color', weight: 3, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'hair_length', label: 'Hair Length', weight: 2, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'skin_tone', label: 'Skin Tone', weight: 2, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  
  // Demographics (for talent)
  { key: 'gender_identity', label: 'Gender Identity', weight: 4, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'ethnicity', label: 'Ethnicity', weight: 3, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'nationality', label: 'Nationality', weight: 3, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'tattoos', label: 'Tattoos/Piercings', weight: 2, category: 'low', applicableRoles: ['TALENT', 'BOTH'] },
]

/**
 * Get applicable fields for a user's role
 */
function getApplicableFields(roleFlags: string[]): ProfileField[] {
  const hasContributor = roleFlags.includes('CONTRIBUTOR')
  const hasTalent = roleFlags.includes('TALENT')
  
  return PROFILE_FIELDS.filter(field => {
    if (!field.applicableRoles) return true
    
    if (hasContributor && hasTalent && field.applicableRoles.includes('BOTH')) return true
    if (hasContributor && field.applicableRoles.includes('CONTRIBUTOR')) return true
    if (hasTalent && field.applicableRoles.includes('TALENT')) return true
    
    return false
  })
}

/**
 * Get missing fields from user profile
 */
export function getMissingFields(profile: UserProfile): ProfileField[] {
  const applicableFields = getApplicableFields(profile.role_flags || [])
  
  return applicableFields.filter(field => {
    const value = profile[field.key]
    return !value || (Array.isArray(value) && value.length === 0)
  })
}

/**
 * Get the top missing field (highest weight)
 */
export function getTopMissingField(profile: UserProfile): { field: ProfileField | null; label: string } {
  const missing = getMissingFields(profile)
  const sorted = missing.sort((a, b) => b.weight - a.weight)
  
  return {
    field: sorted[0] || null,
    label: sorted[0]?.label || 'profile'
  }
}

/**
 * Calculate profile completion impact
 */
export function calculateProfileImpact(profile: UserProfile) {
  const missing = getMissingFields(profile)
  const highImpact = missing.filter(f => f.category === 'high')
  const mediumImpact = missing.filter(f => f.category === 'medium')
  const lowImpact = missing.filter(f => f.category === 'low')
  
  const potentialGain = highImpact.reduce((sum, f) => sum + f.weight, 0)
  
  return {
    current: profile.profile_completion_percentage || 0,
    potential: Math.min(100, (profile.profile_completion_percentage || 0) + potentialGain),
    highImpactFields: highImpact,
    mediumImpactFields: mediumImpact,
    lowImpactFields: lowImpact,
    totalMissing: missing.length,
    highImpactCount: highImpact.length,
    potentialGain
  }
}

/**
 * Get missing fields message (human-readable)
 */
export function getMissingFieldsMessage(profile: UserProfile): string {
  const missing = getMissingFields(profile)
  
  if (missing.length === 0) return 'profile'
  if (missing.length === 1) return missing[0].label
  if (missing.length === 2) return `${missing[0].label} and ${missing[1].label}`
  
  const highImpact = missing.filter(f => f.category === 'high')
  if (highImpact.length > 0) {
    return `${highImpact.length} high-impact field${highImpact.length > 1 ? 's' : ''}`
  }
  
  return `${missing.length} field${missing.length > 1 ? 's' : ''}`
}

/**
 * Get completion message based on current percentage
 */
export function getCompletionMessage(profile: UserProfile): string {
  const percentage = profile.profile_completion_percentage || 0
  
  if (percentage >= 90) {
    return "You're almost there! Complete these final fields to maximize your visibility."
  } else if (percentage >= 75) {
    return "Great progress! Completing these fields will significantly boost your match quality."
  } else if (percentage >= 50) {
    return "You're halfway there! Adding these fields will help you appear in more searches."
  } else {
    return "Let's build your profile! These fields are essential for getting matched with gigs."
  }
}

/**
 * Categorize missing fields for display
 */
export function categorizeMissingFields(profile: UserProfile) {
  const missing = getMissingFields(profile)
  
  return {
    high: missing.filter(f => f.category === 'high'),
    medium: missing.filter(f => f.category === 'medium'),
    low: missing.filter(f => f.category === 'low')
  }
}

/**
 * Calculate potential profile completion with specific field
 */
export function calculatePotentialWithField(profile: UserProfile, fieldKey: keyof UserProfile): number {
  const field = PROFILE_FIELDS.find(f => f.key === fieldKey)
  if (!field) return profile.profile_completion_percentage || 0
  
  const applicableFields = getApplicableFields(profile.role_flags || [])
  const totalWeight = applicableFields.reduce((sum, f) => sum + f.weight, 0)
  
  if (totalWeight === 0) return 0
  
  const currentPercentage = profile.profile_completion_percentage || 0
  const fieldPercentage = (field.weight / totalWeight) * 100
  
  return Math.min(100, Math.round(currentPercentage + fieldPercentage))
}

/**
 * Get profile completion summary
 */
export function getProfileCompletionSummary(profile: UserProfile) {
  const impact = calculateProfileImpact(profile)
  const topMissing = getTopMissingField(profile)
  const message = getCompletionMessage(profile)
  const categorized = categorizeMissingFields(profile)
  
  return {
    current: impact.current,
    potential: impact.potential,
    topMissingField: topMissing.field,
    topMissingLabel: topMissing.label,
    message,
    highImpactFields: categorized.high,
    mediumImpactFields: categorized.medium,
    lowImpactFields: categorized.low,
    totalMissing: impact.totalMissing,
    potentialGain: impact.potentialGain
  }
}

// Export types for use in components
export type { ProfileField }

