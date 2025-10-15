// Matchmaking Types and Interfaces
// This file defines all the types needed for the matchmaking system

export interface CompatibilityBreakdown {
  gender: number
  age: number
  height: number
  experience: number
  specialization: number
  total: number
}

export interface CompatibilityData {
  score: number
  breakdown: CompatibilityBreakdown
  factors: {
    gender_match: boolean
    age_match: boolean
    height_match: boolean
    experience_match: boolean
    specialization_match: number | boolean
  }
}

export interface MatchmakingFilters {
  compatibility_min: number
  compatibility_max: number
  location_radius: number
  date_range: {
    start: Date | null
    end: Date | null
  }
  compensation_types: string[]
  specializations: string[]
  experience_levels: string[]
  availability_status: string[]
}

export interface Recommendation {
  id: string
  type: 'gig' | 'user'
  data: Record<string, unknown> // Will be typed as Gig or UserProfile
  compatibility_score: number
  compatibility_breakdown: CompatibilityBreakdown
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface Gig {
  id: string
  title: string
  description: string
  location_text: string
  start_time: string
  end_time: string
  comp_type: string
  owner_user_id: string
  status: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  handle: string
  bio?: string
  city?: string
  country?: string
  avatar_url?: string
  specializations?: string[]
  years_experience?: number
  hourly_rate_min?: number
  hourly_rate_max?: number
  available_for_travel?: boolean
  created_at: string
  updated_at: string
}

export interface MatchmakingContextType {
  // State
  recommendations: {
    all: Recommendation[]
    filtered: Recommendation[]
  }
  compatibilityCache: Map<string, CompatibilityData>
  filters: MatchmakingFilters
  loading: boolean
  
  // Actions
  fetchRecommendations: () => Promise<void>
  calculateCompatibility: (userId: string, gigId: string) => Promise<CompatibilityData>
  updateFilters: (filters: MatchmakingFilters) => void
  refreshRecommendations: () => Promise<void>
}

// API Response Types
export interface CompatibilityResponse {
  compatibility_score: number
  match_factors: Record<string, unknown>
}

export interface RecommendationsResponse {
  recommendations: Recommendation[]
  total: number
  has_more: boolean
}

// Component Props Types
export interface CompatibilityScoreProps {
  score: number
  breakdown?: CompatibilityBreakdown
  showBreakdown?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface MatchmakingCardProps {
  type: 'gig' | 'user'
  data: Gig | UserProfile
  compatibilityScore: number
  compatibilityBreakdown: CompatibilityBreakdown
  onViewDetails: () => void
  onApply?: () => void
  className?: string
}

export interface CompatibilityBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile: UserProfile
  gig: Gig
  compatibilityData: CompatibilityData
}

export interface MatchmakingFiltersProps {
  onFiltersChange: (filters: MatchmakingFilters) => void
  userType: 'talent' | 'contributor'
  className?: string
}

export interface RecommendationEngineProps {
  userType: 'talent' | 'contributor'
  recommendations: Recommendation[]
  onRecommendationClick: (recommendation: Recommendation) => void
  className?: string
}
