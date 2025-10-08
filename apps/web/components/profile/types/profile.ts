// Profile Page Types and Interfaces
// Extracted from the main profile page component

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  handle: string
  avatar_url?: string
  header_banner_url?: string
  header_banner_position?: string
  role_flags?: string[]
  bio?: string
  city?: string
  country?: string
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
  hourly_rate_min?: number | null
  hourly_rate_max?: number | null
  available_for_travel?: boolean
  travel_radius_km?: number | null
  travel_unit_preference?: 'km' | 'miles'
  studio_name?: string
  has_studio?: boolean
  studio_address?: string
  show_location?: boolean
  typical_turnaround_days?: number | null
  turnaround_unit_preference?: 'days' | 'weeks'
  height_cm?: number | null
  measurements?: string
  eye_color?: string
  hair_color?: string
  shoe_size?: string
  clothing_sizes?: string | null
  tattoos?: boolean
  piercings?: boolean
  talent_categories?: string[]
  contributor_roles?: string[]
  professional_skills?: string[]
  behance_url?: string
  dribbble_url?: string
  style_tags?: string[]
  vibe_tags?: string[]
  date_of_birth?: string
  gender_identity?: string
  ethnicity?: string
  nationality?: string
  weight_kg?: number | null
  body_type?: string
  hair_length?: string
  skin_tone?: string
  experience_level?: string
  primary_skill?: string
  availability_status?: string
  preferred_working_hours?: string // Deprecated - use structured fields below
  working_time_preference?: string
  preferred_start_time?: string
  preferred_end_time?: string
  working_timezone?: string
  state_province?: string
  timezone?: string
  passport_valid?: boolean
  show_age?: boolean
  show_physical_attributes?: boolean
  show_phone?: boolean
  show_social_links?: boolean
  show_website?: boolean
  show_experience?: boolean
  show_specializations?: boolean
  show_equipment?: boolean
  show_rates?: boolean
  include_in_search?: boolean
  show_availability?: boolean
  allow_direct_booking?: boolean
  allow_direct_messages?: boolean
  allow_collaboration_invites?: boolean
  share_analytics?: boolean
  participate_research?: boolean
  accepts_tfp?: boolean
  accepts_expenses_only?: boolean
  prefers_studio?: boolean
  prefers_outdoor?: boolean
  // These fields were removed from the database as redundant:
  // available_weekdays, available_weekends, available_evenings, available_overnight,
  // works_with_teams, prefers_solo_work, comfortable_with_nudity, 
  // comfortable_with_intimate_content, requires_model_release
  verification_status?: string
  profile_completion_percentage?: number
  created_at?: string
  updated_at?: string
}

export interface BannerPosition {
  y: number
  scale: number
}

export interface UserSettings {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  location_visibility: boolean
  profile_visibility: boolean
  created_at?: string
  updated_at?: string
}

export interface NotificationPreferences {
  id?: string
  user_id: string
  location_radius: number
  max_budget: number | null
  min_budget: number | null
  preferred_purposes: string[]
  created_at?: string
  updated_at?: string
}

export type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER'

export interface EquipmentType {
  id: string
  name: string
  is_active: boolean
  created_at?: string
}

export interface EquipmentBrand {
  id: string
  name: string
  equipment_type_id: string
  is_active: boolean
  created_at?: string
}

export interface EquipmentModel {
  id: string
  name: string
  brand_id: string
  is_active: boolean
  created_at?: string
}

export interface PredefinedOption {
  id: string
  name: string
  type: string
  is_active: boolean
  created_at?: string
}

// Form validation types
export interface ValidationResult {
  isValid: boolean
  error?: string
}

export type ValidationType = 'talent_category' | 'specialization' | 'eye_color' | 'hair_color' | 'brand' | 'model'

// Profile context types
export interface ProfileState {
  profile: UserProfile | null
  settings: UserSettings | null
  notificationPrefs: NotificationPreferences | null
  isEditing: boolean
  isEditingHeader: boolean
  editingStudioName: boolean
  editingStudioAddress: boolean
  formData: Partial<UserProfile>
  loading: boolean
  saving: boolean
  error: string | null
  activeTab: string
  activeSubTab: string
  showLocation: boolean
  isDraggingHeader: boolean
  headerPosition: BannerPosition
}

export type ProfileAction = 
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_SETTINGS'; payload: UserSettings | null }
  | { type: 'SET_NOTIFICATION_PREFS'; payload: NotificationPreferences }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_EDITING_HEADER'; payload: boolean }
  | { type: 'SET_EDITING_STUDIO_NAME'; payload: boolean }
  | { type: 'SET_EDITING_STUDIO_ADDRESS'; payload: boolean }
  | { type: 'SET_FORM_DATA'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: string; value: any } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_ACTIVE_SUB_TAB'; payload: string }
  | { type: 'SET_SHOW_LOCATION'; payload: boolean }
  | { type: 'SET_DRAGGING_HEADER'; payload: boolean }
  | { type: 'SET_HEADER_POSITION'; payload: BannerPosition }
  | { type: 'RESET_FORM_DATA' }

// Component prop types
export interface FormFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  type?: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'date' | 'range'
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  className?: string
  min?: number
  max?: number
  step?: number
}

export interface TagInputProps {
  label: string
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  placeholder?: string
  predefinedOptions?: string[]
  validationType?: ValidationType
  error?: string
  className?: string
}

export interface ToggleSwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  description?: string
}

export interface MediaUploadProps {
  type: 'avatar' | 'banner'
  currentUrl?: string
  onUpload: (url: string) => void
  onPositionChange?: (position: BannerPosition) => void
  className?: string
}

export interface ValidationMessageProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  className?: string
}

// Hook return types
export interface UseProfileDataReturn {
  profile: UserProfile | null
  settings: UserSettings | null
  notificationPrefs: NotificationPreferences | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseProfileFormReturn {
  formData: Partial<UserProfile>
  isEditing: boolean
  saving: boolean
  error: string | null
  handleFieldChange: (field: string, value: any) => void
  handleSave: () => Promise<void>
  handleCancel: () => void
  setEditing: (editing: boolean) => void
}

export interface UseMediaUploadReturn {
  uploading: boolean
  uploadError: string | null
  uploadFile: (file: File, type: 'avatar' | 'banner') => Promise<string | null>
  uploadProgress: number
}

export interface UseValidationReturn {
  validateField: (field: string, value: any) => ValidationResult
  validateTag: (tag: string, type: ValidationType) => Promise<ValidationResult>
  fieldErrors: Record<string, string>
  setFieldError: (field: string, error: string) => void
  clearFieldError: (field: string) => void
}

// Constants
export const PURPOSE_LABELS: Record<PurposeType, string> = {
  'PORTFOLIO': 'Portfolio Building',
  'COMMERCIAL': 'Commercial Work',
  'EDITORIAL': 'Editorial',
  'FASHION': 'Fashion',
  'BEAUTY': 'Beauty',
  'LIFESTYLE': 'Lifestyle',
  'WEDDING': 'Wedding',
  'EVENT': 'Event',
  'PRODUCT': 'Product',
  'ARCHITECTURE': 'Architecture',
  'STREET': 'Street',
  'CONCEPTUAL': 'Conceptual',
  'OTHER': 'Other'
}

export const FALLBACK_VIBES = [
  'Professional', 'Creative', 'Experimental', 'Classic',
  'Bold', 'Natural', 'Dramatic', 'Soft', 'Edgy', 'Timeless'
]

export const FALLBACK_STYLES = [
  'Portrait', 'Fashion', 'Editorial', 'Commercial', 'Beauty',
  'Lifestyle', 'Street', 'Documentary', 'Fine Art', 'Conceptual',
  'Wedding', 'Event', 'Product', 'Architecture', 'Nature'
]
