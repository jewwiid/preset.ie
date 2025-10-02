import { UserProfile } from '../types/dashboard'

// Simplified credit calculation
export const calculateCreditValue = (credits: number) => credits * 0.01

// Profile completion calculation
export const calculateProfileCompletion = (profile: UserProfile): { percentage: number; missingFields: string[] } => {
  const fields = [
    { key: 'bio', label: 'Bio', weight: 5 },
    { key: 'city', label: 'Location', weight: 5 },
    { key: 'country', label: 'Country', weight: 3 },
    { key: 'phone_number', label: 'Phone Number', weight: 3 },
    { key: 'instagram_handle', label: 'Instagram', weight: 2 },
    { key: 'tiktok_handle', label: 'TikTok', weight: 2 },
    { key: 'website_url', label: 'Website', weight: 3 },
    { key: 'portfolio_url', label: 'Portfolio', weight: 5 },
    { key: 'years_experience', label: 'Experience', weight: 8 },
    { key: 'specializations', label: 'Specializations', weight: 10 },
    { key: 'equipment_list', label: 'Equipment', weight: 5 },
    { key: 'editing_software', label: 'Software', weight: 5 },
    { key: 'languages', label: 'Languages', weight: 3 },
    { key: 'hourly_rate_min', label: 'Rate Range', weight: 8 },
    { key: 'available_for_travel', label: 'Travel Availability', weight: 3 },
    { key: 'has_studio', label: 'Studio Info', weight: 3 },
    { key: 'typical_turnaround_days', label: 'Turnaround Time', weight: 3 },

    // New demographic fields
    { key: 'gender_identity', label: 'Gender Identity', weight: 3 },
    { key: 'ethnicity', label: 'Ethnicity', weight: 2 },
    { key: 'nationality', label: 'Nationality', weight: 2 },
    { key: 'body_type', label: 'Body Type', weight: 3 },
    { key: 'experience_level', label: 'Experience Level', weight: 5 },
    { key: 'state_province', label: 'State/Province', weight: 2 },
    { key: 'availability_status', label: 'Availability Status', weight: 4 },

    // Work preferences
    { key: 'accepts_tfp', label: 'TFP Acceptance', weight: 3 },
    { key: 'prefers_studio', label: 'Studio Preference', weight: 2 },
    { key: 'prefers_outdoor', label: 'Outdoor Preference', weight: 2 },
    { key: 'available_weekdays', label: 'Weekday Availability', weight: 2 },
    { key: 'available_weekends', label: 'Weekend Availability', weight: 2 },
    { key: 'works_with_teams', label: 'Team Work Preference', weight: 2 }
  ]

  let completedWeight = 0
  let totalWeight = 0
  const missingFields: string[] = []

  fields.forEach(field => {
    totalWeight += field.weight
    const value = profile[field.key as keyof UserProfile]

    if (value !== undefined && value !== null && value !== '' &&
        (!Array.isArray(value) || value.length > 0)) {
      completedWeight += field.weight
    } else {
      missingFields.push(field.label)
    }
  })

  return {
    percentage: Math.round((completedWeight / totalWeight) * 100),
    missingFields
  }
}

// Calculate time ago for messages/notifications
export const getTimeAgo = (dateString: string): string => {
  const now = new Date()
  const messageTime = new Date(dateString)
  const diffMs = now.getTime() - messageTime.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Calculate days until expiration
export const getDaysUntilExpiry = (expiresAt: string): number => {
  return Math.ceil(
    (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
}

// Get user initials for avatar fallback
export const getUserInitials = (displayName: string): string => {
  return displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U'
}
