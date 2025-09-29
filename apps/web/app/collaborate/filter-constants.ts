/**
 * Filter constants for collaboration projects
 * These values are used in dropdown filters on the /collaborate page
 */

export const ROLE_TYPES = [
  'Photographer',
  'Videographer',
  'Director',
  'Cinematographer',
  'Model',
  'Actor/Actress',
  'Makeup Artist',
  'Hair Stylist',
  'Wardrobe Stylist',
  'Fashion Stylist',
  'Location Scout',
  'Producer',
  'Production Assistant',
  'Assistant',
  'Editor',
  'Sound Engineer',
  'Audio Technician',
  'Lighting Technician',
  'Gaffer',
  'Grip',
  'Art Director',
  'Set Designer',
  'Props Master',
  'Costume Designer',
  'Script Supervisor',
  'Storyboard Artist'
] as const;

export const GEAR_CATEGORIES = [
  'Camera',
  'Lens',
  'Lighting',
  'Audio Equipment',
  'Microphone',
  'Tripod',
  'Monopod',
  'Gimbal',
  'Stabilizer',
  'Drone',
  'Monitor',
  'Field Monitor',
  'Backdrop',
  'Background',
  'Reflector',
  'Diffuser',
  'Softbox',
  'Recording Equipment',
  'Editing Setup',
  'Computer/Laptop',
  'Props',
  'Wardrobe',
  'Makeup Kit',
  'Hair Styling Tools',
  'Grip Equipment',
  'Cables & Accessories',
  'Storage & Media',
  'Other Equipment'
] as const;

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

export type RoleType = typeof ROLE_TYPES[number];
export type GearCategory = typeof GEAR_CATEGORIES[number];
export type ProjectStatus = typeof PROJECT_STATUSES[number]['value'];
export type SortOption = typeof SORT_OPTIONS[number]['value'];
export type CommonCountry = typeof COMMON_COUNTRIES[number];
