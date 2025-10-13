export type CompensationType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER';
export type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER';
export type UsageRightsType = 'PORTFOLIO_ONLY' | 'SOCIAL_MEDIA_PERSONAL' | 'SOCIAL_MEDIA_COMMERCIAL' | 'WEBSITE_PERSONAL' | 'WEBSITE_COMMERCIAL' | 'EDITORIAL_PRINT' | 'COMMERCIAL_PRINT' | 'ADVERTISING' | 'FULL_COMMERCIAL' | 'EXCLUSIVE_BUYOUT' | 'CUSTOM';

export interface Gig {
  id: string;
  title: string;
  description: string;
  purpose?: PurposeType;
  comp_type: CompensationType;
  looking_for_types?: string[];
  location_text: string;
  start_time: string;
  end_time: string;
  application_deadline: string;
  max_applicants: number;
  current_applicants?: number;
  moodboard_urls?: string[];
  usage_rights?: string;
  status: string;
  created_at: string;
  owner_user_id: string;
  users_profile?: {
    display_name: string;
    avatar_url?: string;
    handle: string;
    verified_id?: boolean;
    years_experience?: number;
    specializations?: string[];
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    available_for_travel?: boolean;
    travel_radius_km?: number;
    has_studio?: boolean;
    studio_name?: string;
    instagram_handle?: string;
    tiktok_handle?: string;
    website_url?: string;
    portfolio_url?: string;
  };
  is_saved?: boolean;
  applications_count?: number;
  palette_colors?: string[];
  moodboards?: any[];
  style_tags?: string[];
  vibe_tags?: string[];
  city?: string;
  country?: string;
}

export interface GigFilters {
  searchTerm: string;
  selectedCompType: CompensationType | 'ALL';
  selectedPurpose: PurposeType | 'ALL';
  selectedUsageRights: string;
  locationFilter: string;
  startDateFilter: string;
  endDateFilter: string;
  maxApplicantsFilter: number | null;
  selectedPalette: string[];
  selectedStyleTags: string[];
  selectedVibeTags: string[];
  selectedRoleTypes: string[];
  minExperienceFilter: number | null;
  maxExperienceFilter: number | null;
  selectedSpecializations: string[];
  minRateFilter: number | null;
  maxRateFilter: number | null;
  travelOnlyFilter: boolean;
  studioOnlyFilter: boolean;
}
