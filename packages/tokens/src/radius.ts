/**
 * Preset Design System - Radius Tokens
 * Consistent border radius values for modern, approachable design
 */

// Base radius scale
export const radius = {
  none: '0',
  xs: '0.125rem',    // 2px - subtle rounding
  sm: '0.25rem',     // 4px - small components
  md: '0.375rem',    // 6px - default radius
  lg: '0.5rem',      // 8px - cards, larger elements
  xl: '0.75rem',     // 12px - large cards
  '2xl': '1rem',     // 16px - major containers
  '3xl': '1.5rem',   // 24px - hero elements
  full: '9999px',    // Pills, circular elements
} as const;

// Semantic radius for specific components
export const semanticRadius = {
  // Interactive elements
  button: {
    sm: radius.sm,     // Small buttons
    md: radius.md,     // Default buttons  
    lg: radius.lg,     // Large buttons
    pill: radius.full, // Pill-style buttons
  },
  
  // Input elements
  input: {
    sm: radius.sm,     // Compact inputs
    md: radius.md,     // Default inputs
    lg: radius.lg,     // Large inputs
  },
  
  // Cards and containers
  card: {
    sm: radius.lg,     // Small cards
    md: radius.xl,     // Default cards
    lg: radius['2xl'], // Large cards
  },
  
  // Media elements
  media: {
    sm: radius.md,     // Small images/videos
    md: radius.lg,     // Default media
    lg: radius.xl,     // Large media
    avatar: radius.full, // Circular avatars
  },
  
  // Modal and overlay elements
  modal: {
    sm: radius.lg,     // Small modals
    md: radius.xl,     // Default modals
    lg: radius['2xl'], // Large modals
  },
  
  // Badge and tag elements
  badge: {
    sm: radius.sm,     // Small badges
    md: radius.md,     // Default badges
    pill: radius.full, // Pill badges
  },
} as const;

// Special radius patterns for creative platform
export const creativeRadius = {
  // Gig cards (image-first design)
  gig: {
    card: radius.xl,      // Gig card container
    image: radius.lg,     // Gig preview images
    moodboard: radius.md, // Moodboard thumbnails
  },
  
  // Profile elements
  profile: {
    avatar: radius.full,  // Profile pictures
    showcase: radius.lg,  // Showcase images
    badge: radius.full,   // Verification badges
  },
  
  // Creative content
  showcase: {
    thumbnail: radius.md, // Showcase thumbnails
    viewer: radius.lg,    // Full-size showcase viewer
  },
} as const;

// Type definitions
export type Radius = typeof radius;
export type SemanticRadius = typeof semanticRadius;
export type CreativeRadius = typeof creativeRadius;