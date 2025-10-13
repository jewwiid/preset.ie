/**
 * Applications Module - Helper Functions
 *
 * Pure utility functions for application data normalization,
 * formatting, and status management.
 */

import {
  Clock,
  Star,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type {
  Application,
  ApplicationStatus,
  Gig,
  CollaborationProject,
  CollaborationRole,
  UserProfile,
} from '../types';
import { STATUS_COLORS } from '../constants/applicationConfig';

/**
 * Normalize a gig application into the unified Application format
 */
export function normalizeGigApplication(gigApp: any): Application {
  return {
    ...gigApp,
    application_type: 'gig' as const,
    project_title: gigApp.gig?.title,
    project_description: gigApp.gig?.comp_type,
    project_location: gigApp.gig?.location_text,
    project_start_date: gigApp.gig?.start_time,
    project_creator: gigApp.gig?.users_profile,
    applied_at: gigApp.applied_at,
  };
}

/**
 * Normalize a collaboration application into the unified Application format
 */
export function normalizeCollaborationApplication(
  collabApp: any,
  compatibilityData?: {
    overall_score?: number;
    matched_skills?: string[];
    missing_skills?: string[];
  }
): Application {
  const projectLocation =
    collabApp.project?.city && collabApp.project?.country
      ? `${collabApp.project.city}, ${collabApp.project.country}`
      : collabApp.project?.city || collabApp.project?.country;

  return {
    ...collabApp,
    application_type: 'collaboration' as const,
    project_title: collabApp.project?.title,
    project_description: collabApp.project?.description,
    project_location: projectLocation,
    project_start_date: collabApp.project?.start_date,
    project_creator: collabApp.project?.creator,
    applied_at: collabApp.created_at,
    role_name: collabApp.role?.role_name,
    skills_required: collabApp.role?.skills_required,
    compatibility_score: compatibilityData?.overall_score,
    matched_skills: compatibilityData?.matched_skills || [],
    missing_skills: compatibilityData?.missing_skills || [],
  };
}

/**
 * Get the CSS class for a status badge
 */
export function getStatusColor(status: ApplicationStatus): string {
  return STATUS_COLORS[status] || 'bg-muted text-muted-foreground';
}

/**
 * Get the icon component for a status
 */
export function getStatusIcon(status: ApplicationStatus): LucideIcon | null {
  switch (status) {
    case 'PENDING':
    case 'pending':
      return Clock;
    case 'SHORTLISTED':
      return Star;
    case 'ACCEPTED':
    case 'accepted':
      return CheckCircle;
    case 'DECLINED':
    case 'rejected':
    case 'withdrawn':
      return XCircle;
    default:
      return null;
  }
}

/**
 * Format a date string for display
 */
export function formatApplicationDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if an action can be performed on an application
 * based on its current status and the user's role
 */
export function canPerformAction(
  status: ApplicationStatus,
  action: string,
  viewMode: 'contributor' | 'talent' | 'admin'
): boolean {
  const permissions: Record<
    string,
    Record<ApplicationStatus, string[]>
  > = {
    contributor: {
      PENDING: ['shortlist', 'accept', 'decline'],
      SHORTLISTED: ['accept', 'decline'],
      ACCEPTED: [],
      DECLINED: [],
      pending: ['shortlist', 'accept', 'decline'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    },
    talent: {
      PENDING: ['withdraw'],
      SHORTLISTED: ['withdraw'],
      ACCEPTED: [],
      DECLINED: [],
      pending: ['withdraw'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    },
    admin: {
      PENDING: ['shortlist', 'accept', 'decline', 'ban', 'delete'],
      SHORTLISTED: ['accept', 'decline', 'ban', 'delete'],
      ACCEPTED: ['ban', 'delete'],
      DECLINED: ['ban', 'delete'],
      pending: ['shortlist', 'accept', 'decline', 'ban', 'delete'],
      accepted: ['ban', 'delete'],
      rejected: ['ban', 'delete'],
      withdrawn: ['ban', 'delete'],
    },
  };

  return permissions[viewMode]?.[status]?.includes(action) ?? false;
}

/**
 * Get display label for application type
 */
export function getApplicationTypeLabel(type: 'gig' | 'collaboration'): string {
  return type === 'gig' ? 'Gig' : 'Collaboration';
}

/**
 * Get a shortened version of application type badge
 */
export function getApplicationTypeBadge(type: 'gig' | 'collaboration'): string {
  return type === 'gig' ? 'G' : 'C';
}

/**
 * Check if a user is banned
 */
export function isUserBanned(roleFlags?: string[]): boolean {
  return roleFlags?.includes('BANNED') ?? false;
}

/**
 * Check if a user is verified
 */
export function isUserVerified(roleFlags?: string[]): boolean {
  return roleFlags?.includes('VERIFIED_ID') ?? false;
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Parse style tags from various formats (array or comma-separated string)
 */
export function parseStyleTags(
  styleTags: string[] | string | null | undefined
): string[] {
  if (!styleTags) return [];

  if (Array.isArray(styleTags)) {
    return styleTags.map((tag) => String(tag).trim());
  }

  if (typeof styleTags === 'string') {
    return styleTags.split(',').map((tag) => tag.trim());
  }

  return [];
}

/**
 * Calculate application age in days
 */
export function getApplicationAgeDays(appliedAt: string): number {
  const now = new Date();
  const applied = new Date(appliedAt);
  const diffTime = Math.abs(now.getTime() - applied.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if an application is recent (within last 7 days)
 */
export function isRecentApplication(appliedAt: string): boolean {
  return getApplicationAgeDays(appliedAt) <= 7;
}
