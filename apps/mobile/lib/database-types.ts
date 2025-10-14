// Database Types - Based on actual Supabase schema
// This ensures type safety across the mobile app

export type UserRole = 'CONTRIBUTOR' | 'TALENT' | 'ADMIN' | 'BOTH'
export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL'
export type GigStatus = 'DRAFT' | 'PUBLISHED' | 'APPLICATIONS_CLOSED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED'
export type CompensationType = 'TFP' | 'PAID' | 'EXPENSES'
export type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN'
export type ShowcaseVisibility = 'DRAFT' | 'PUBLIC' | 'PRIVATE'
export type MediaType = 'image' | 'video' | 'pdf'

// Core Database Tables
export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  handle: string
  avatar_url?: string
  bio?: string
  city?: string
  role_flags: UserRole[]
  style_tags: string[]
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  subscription_started_at: string
  subscription_expires_at?: string
  verified_id: boolean
  created_at: string
  updated_at: string
  // Additional fields from migrations
  header_banner_url?: string
  header_banner_position?: string
  verification_status?: string
}

export interface Gig {
  id: string
  owner_user_id: string
  title: string
  description: string
  comp_type: CompensationType
  comp_details?: string
  location_text: string
  location?: any // PostGIS geography point
  radius_meters?: number
  start_time: string
  end_time: string
  application_deadline: string
  max_applicants: number
  usage_rights: string
  safety_notes?: string
  status: GigStatus
  boost_level: number
  created_at: string
  updated_at: string
  // Additional fields from migrations
  moodboard_url?: string
  moodboard_urls?: string[]
  purpose?: string
  vibe_tags?: string[]
}

export interface Application {
  id: string
  gig_id: string
  applicant_user_id: string
  note?: string
  status: ApplicationStatus
  applied_at: string
  updated_at: string
}

export interface Showcase {
  id: string
  gig_id: string
  creator_user_id: string
  talent_user_id: string
  media_ids: string[]
  caption?: string
  tags: string[]
  palette?: any
  approved_by_creator_at?: string
  approved_by_talent_at?: string
  visibility: ShowcaseVisibility
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  gig_id: string
  from_user_id: string
  to_user_id: string
  body: string
  attachments: any[]
  created_at: string
  read_at?: string
}

export interface Media {
  id: string
  owner_user_id: string
  gig_id?: string
  type: MediaType
  bucket: string
  path: string
  width?: number
  height?: number
  duration?: number
  palette?: any
  blurhash?: string
  exif_json?: any
  visibility: ShowcaseVisibility
  created_at: string
}

export interface Moodboard {
  id: string
  gig_id: string
  owner_user_id: string
  title?: string
  summary?: string
  palette?: any
  items: any[]
  created_at: string
  updated_at: string
  // Additional fields from migrations
  is_public?: boolean
  source_breakdown?: any
  enhancement_log?: any[]
  total_cost?: number
  generated_prompts?: string[]
  ai_provider?: string
}

export interface UserSettings {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  profile_visibility: 'public' | 'private'
  show_contact_info: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
  // Additional fields from migrations
  message_notifications?: boolean
  message_read_receipts?: boolean
  allow_stranger_messages?: boolean
}

export interface UserCredits {
  id: string
  user_id: string
  subscription_tier: string
  monthly_allowance: number
  current_balance: number
  consumed_this_month: number
  last_reset_at: string
  lifetime_consumed: number
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  moodboard_id?: string
  transaction_type: 'deduction' | 'refund' | 'allocation'
  credits_used: number
  cost_usd?: number
  provider?: string
  api_request_id?: string
  enhancement_type?: string
  status: 'completed' | 'failed' | 'pending'
  error_message?: string
  created_at: string
}

export interface LootboxEvent {
  id: string
  event_type: 'available' | 'purchased' | 'expired'
  nano_banana_threshold: number
  nano_banana_credits_at_trigger: number
  user_credits_offered: number
  price_usd: number
  margin_percentage: number
  available_at: string
  expires_at?: string
  purchased_at?: string
  purchased_by?: string
  created_at: string
  updated_at: string
}

export interface LootboxPackage {
  id: string
  name: string
  description?: string
  user_credits: number
  price_usd: number
  nano_banana_threshold: number
  margin_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Extended interfaces with joins
export interface GigWithProfile extends Gig {
  users_profile: Pick<UserProfile, 'display_name' | 'avatar_url' | 'handle' | 'verified_id'>
  city?: string
  country?: string
  moodboard_urls?: string[]
}

export interface ApplicationWithGig extends Application {
  gig: Pick<Gig, 'title' | 'description' | 'comp_type' | 'location_text' | 'start_time' | 'status'> & {
    users_profile?: Pick<UserProfile, 'display_name' | 'handle'>
  }
}

export interface ShowcaseWithMedia extends Showcase {
  media: Media[]
}

export interface MessageWithProfiles extends Message {
  from_profile: Pick<UserProfile, 'display_name' | 'avatar_url' | 'handle'>
  to_profile: Pick<UserProfile, 'display_name' | 'avatar_url' | 'handle'>
}

// Utility types
export interface DatabaseResponse<T> {
  data: T | null
  error: any
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  error: any
}

// Query filters
export interface GigFilters {
  status?: GigStatus
  comp_type?: CompensationType
  location?: string
  search?: string
  owner_user_id?: string
}

export interface ApplicationFilters {
  status?: ApplicationStatus
  gig_id?: string
  applicant_user_id?: string
}

export interface ShowcaseFilters {
  visibility?: ShowcaseVisibility
  creator_user_id?: string
  talent_user_id?: string
  tags?: string[]
}

// Form data types
export interface CreateGigData {
  title: string
  description: string
  comp_type: CompensationType
  comp_details?: string
  location_text: string
  start_time: string
  end_time: string
  application_deadline: string
  max_applicants: number
  usage_rights: string
  safety_notes?: string
}

export interface UpdateProfileData {
  display_name?: string
  bio?: string
  city?: string
  style_tags?: string[]
  avatar_url?: string
  header_banner_url?: string
  header_banner_position?: string
}

export interface CreateApplicationData {
  gig_id: string
  note?: string
}

export interface SendMessageData {
  gig_id: string
  to_user_id: string
  body: string
  attachments?: any[]
}
