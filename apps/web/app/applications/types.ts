/**
 * Applications Module - Type Definitions
 *
 * Centralized type definitions for the applications management system.
 * Supports both gig applications and collaboration project applications.
 */

export type ApplicationStatus =
  | 'PENDING'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type ApplicationType = 'gig' | 'collaboration';

export type ViewMode = 'contributor' | 'talent' | 'admin';

/**
 * Profile information for users
 */
export interface UserProfile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  style_tags?: string[];
  account_type?: string[];
  subscription_tier?: string;
  created_at?: string;
}

/**
 * Gig information (for gig applications)
 */
export interface Gig {
  id: string;
  title: string;
  comp_type: string;
  start_time: string;
  location_text: string;
  owner_user_id?: string;
  users_profile?: UserProfile;
}

/**
 * Project information (for collaboration applications)
 */
export interface CollaborationProject {
  id: string;
  title: string;
  description?: string;
  city?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  creator?: UserProfile;
}

/**
 * Role information (for collaboration applications)
 */
export interface CollaborationRole {
  id: string;
  role_name: string;
  skills_required?: string[];
}

/**
 * Unified Application interface
 * Supports both gig and collaboration applications
 */
export interface Application {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  created_at?: string;
  application_type: ApplicationType;
  note?: string;

  // Foreign keys
  gig_id?: string;
  project_id?: string;
  applicant_user_id?: string;
  applicant_id?: string;

  // Normalized fields for unified display
  project_title?: string;
  project_description?: string;
  project_location?: string;
  project_start_date?: string;
  project_creator?: UserProfile;
  role_name?: string;
  skills_required?: string[];

  // Original data (preserved for type-specific logic)
  gig?: Gig;
  project?: CollaborationProject;
  role?: CollaborationRole;

  // Applicant information
  applicant: UserProfile;

  // Compatibility data (for collaboration applications)
  compatibility_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
}

/**
 * Filter state for applications
 */
export interface FilterState {
  searchTerm: string;
  selectedStatus: ApplicationStatus | 'ALL';
  typeFilter?: 'all' | 'gig' | 'collaboration';
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

/**
 * Statistics for applications
 */
export interface ApplicationStats {
  total: number;
  pending: number;
  shortlisted: number;
  accepted: number;
  declined: number;
  withdrawn: number;
  byType?: {
    gig: number;
    collaboration: number;
  };
}

/**
 * Admin statistics
 */
export interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  flaggedUsers: number;
  recentBans: number;
}

/**
 * Sort options for applications
 */
export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'status'
  | 'compatibility-desc'
  | 'compatibility-asc';

/**
 * Bulk action types
 */
export type BulkActionType = 'accept' | 'reject' | 'shortlist' | 'delete';
