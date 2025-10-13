/**
 * Applications Module - Configuration Constants
 *
 * Centralized configuration for status definitions, filter options,
 * and action permissions.
 */

import type { ApplicationStatus, SortOption } from '../types';

/**
 * Available status options for filtering
 */
export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const;

/**
 * Status color mappings for UI
 */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'PENDING': 'bg-primary/10 text-primary',
  'SHORTLISTED': 'bg-primary/10 text-primary',
  'ACCEPTED': 'bg-primary/10 text-primary',
  'DECLINED': 'bg-destructive/10 text-destructive',
  'pending': 'bg-primary/10 text-primary',
  'accepted': 'bg-primary/10 text-primary',
  'rejected': 'bg-destructive/10 text-destructive',
  'withdrawn': 'bg-muted text-muted-foreground',
};

/**
 * Sort options for applications
 */
export const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'status', label: 'By Status' },
  { value: 'compatibility-desc', label: 'Best Match First' },
  { value: 'compatibility-asc', label: 'Worst Match First' },
];

/**
 * Filter options for application type
 */
export const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'gig', label: 'Gig Applications' },
  { value: 'collaboration', label: 'Collaboration Applications' },
] as const;

/**
 * Action permissions based on status and view mode
 */
export const ACTION_PERMISSIONS = {
  contributor: {
    PENDING: ['shortlist', 'accept', 'decline'],
    SHORTLISTED: ['accept', 'decline'],
    ACCEPTED: [],
    DECLINED: [],
    withdrawn: [],
  },
  talent: {
    PENDING: ['withdraw'],
    SHORTLISTED: ['withdraw'],
    ACCEPTED: [],
    DECLINED: [],
    withdrawn: [],
  },
  admin: {
    PENDING: ['shortlist', 'accept', 'decline', 'ban', 'delete'],
    SHORTLISTED: ['accept', 'decline', 'ban', 'delete'],
    ACCEPTED: ['ban', 'delete'],
    DECLINED: ['ban', 'delete'],
    withdrawn: ['ban', 'delete'],
  },
} as const;

/**
 * Default filter state
 */
export const DEFAULT_FILTER_STATE = {
  searchTerm: '',
  selectedStatus: 'ALL' as const,
  typeFilter: 'all' as const,
  dateRange: undefined,
};

/**
 * Pagination settings
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  ADMIN_MAX_RESULTS: 200,
} as const;
