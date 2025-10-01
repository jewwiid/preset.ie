/**
 * Filter constants for collaboration projects
 * These values are used in dropdown filters on the /collaborate page
 */

// ROLE_TYPES and GEAR_CATEGORIES are now fetched from the database
// See: /api/collab/predefined/roles and /api/collab/predefined/gear-categories

export const PROJECT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: '-created_at', label: 'Oldest First' },
  { value: 'start_date', label: 'Start Date (Soonest)' },
  { value: '-start_date', label: 'Start Date (Latest)' },
  { value: 'title', label: 'Title A-Z' },
  { value: '-title', label: 'Title Z-A' }
] as const;

// Common countries for quick filtering
export const COMMON_COUNTRIES = [
  'Ireland',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Poland',
  'Austria',
  'Switzerland',
  'Portugal',
  'Greece',
  'Japan',
  'South Korea',
  'Singapore',
  'New Zealand',
  'Brazil',
  'Mexico',
  'Argentina',
  'India',
  'UAE',
  'South Africa'
] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number]['value'];
export type SortOption = typeof SORT_OPTIONS[number]['value'];
export type CommonCountry = typeof COMMON_COUNTRIES[number];
