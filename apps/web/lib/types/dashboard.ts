export interface UserProfile {
  id: string
  display_name: string
  handle: string
  bio?: string
  city?: string
  country?: string
  age_verified?: boolean
  account_status?: string
  phone_number?: string
  instagram_handle?: string
  tiktok_handle?: string
  website_url?: string
  portfolio_url?: string
  years_experience?: number
  specializations?: string[]
  equipment_list?: string[]
  editing_software?: string[]
  languages?: string[]
  hourly_rate_min?: number
  hourly_rate_max?: number
  available_for_travel?: boolean
  travel_radius_km?: number
  studio_name?: string
  has_studio?: boolean
  studio_address?: string
  typical_turnaround_days?: number
  height_cm?: number
  measurements?: string
  eye_color?: string
  hair_color?: string
  shoe_size?: string
  clothing_sizes?: string
  tattoos?: boolean
  piercings?: boolean
  talent_categories?: string[]
  contributor_roles?: string[]
  professional_skills?: string[]
  behance_url?: string
  dribbble_url?: string
  role_flags: string[]
  style_tags: string[]
  subscription_tier: string
  verification_status: string
  avatar_url?: string
  header_banner_url?: string
  header_banner_position?: string // JSON string of BannerPosition

  // New demographic fields from migration
  gender_identity?: 'male' | 'female' | 'non_binary' | 'genderfluid' | 'agender' | 'transgender_male' | 'transgender_female' | 'prefer_not_to_say' | 'other'
  ethnicity?: 'african_american' | 'asian' | 'caucasian' | 'hispanic_latino' | 'middle_eastern' | 'native_american' | 'pacific_islander' | 'mixed_race' | 'other' | 'prefer_not_to_say'
  nationality?: string
  weight_kg?: number
  body_type?: 'petite' | 'slim' | 'athletic' | 'average' | 'curvy' | 'plus_size' | 'muscular' | 'tall' | 'short' | 'other'
  hair_length?: string
  skin_tone?: string
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'expert'
  state_province?: string
  timezone?: string
  passport_valid?: boolean
  availability_status?: 'available' | 'busy' | 'unavailable' | 'limited' | 'weekends_only' | 'weekdays_only'
  preferred_working_hours?: string // Deprecated - use structured fields below
  working_time_preference?: string
  preferred_start_time?: string
  preferred_end_time?: string
  working_timezone?: string
  blackout_dates?: string[]

  // Privacy controls
  show_age?: boolean
  show_location?: boolean
  show_physical_attributes?: boolean

  // Work preferences
  accepts_tfp?: boolean
  accepts_expenses_only?: boolean
  prefers_studio?: boolean
  prefers_outdoor?: boolean
  available_weekdays?: boolean
  available_weekends?: boolean
  available_evenings?: boolean
  available_overnight?: boolean
  works_with_teams?: boolean
  prefers_solo_work?: boolean
  comfortable_with_nudity?: boolean
  comfortable_with_intimate_content?: boolean
  requires_model_release?: boolean
  profile_completion_percentage?: number
}

export interface BannerPosition {
  y: number
  scale: number
}

export interface RecentGig {
  id: string
  title: string
  description: string
  comp_type: string
  location_text: string
  created_at: string
  status: string
}

export interface DashboardStats {
  totalGigs: number
  totalApplications: number
  totalShowcases: number
  totalMessages: number
}

export interface CreditsData {
  current_balance: number
  monthly_allowance: number
  consumed_this_month: number
}

export interface Invitation {
  id: string
  project?: {
    id: string
    title: string
  }
  role?: {
    id: string
    role_name: string
  }
  inviter?: {
    id: string
    display_name: string
    avatar_url?: string
  }
  message?: string
  expires_at: string
  created_at: string
}

export interface Conversation {
  id: string
  other_user?: {
    id: string
    display_name: string
    avatar_url?: string
  }
  last_message: string
  last_message_time: string
  context_type?: 'gig' | 'marketplace' | 'general'
  gig_id?: string
  listing_id?: string
  unread_count?: number
}
