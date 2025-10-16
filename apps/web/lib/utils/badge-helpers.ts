/**
 * Centralized badge styling utilities
 *
 * This file consolidates badge color/variant logic used across multiple components.
 * Use these utilities instead of defining badge colors inline.
 */

import { type BadgeProps } from '@/components/ui/badge';

/**
 * Badge color configuration type
 */
export interface BadgeColorConfig {
  className: string;
  variant?: BadgeProps['variant'];
}

/**
 * Preset category colors
 * Used in: PresetCard, PresetSelector, etc.
 */
export function getPresetCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    headshot: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    product_photography: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    ecommerce: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    corporate_portrait: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    linkedin_photo: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    style: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    cinematic: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    technical: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
}

/**
 * Preset type badge configuration
 * Used in: PresetCard
 */
export function getPresetTypeBadge(presetId: string): BadgeColorConfig | null {
  const lowerCaseId = presetId.toLowerCase();

  if (lowerCaseId.includes('headshot') || lowerCaseId.includes('corporate') || lowerCaseId.includes('linkedin')) {
    return {
      className: 'text-xs bg-blue-50 border-blue-200 text-blue-700',
      variant: 'outline',
    };
  }

  if (lowerCaseId.includes('product') || lowerCaseId.includes('ecommerce')) {
    return {
      className: 'text-xs bg-purple-50 border-purple-200 text-purple-700',
      variant: 'outline',
    };
  }

  return null;
}

/**
 * Listing condition colors
 * Used in: ListingCard, EnhancedListingCard, etc.
 */
export function getListingConditionColor(condition?: string): string {
  if (!condition) return 'bg-muted text-muted-foreground';

  switch (condition) {
    case 'new':
    case 'like_new':
    case 'good':
    case 'fair':
      return 'bg-primary/10 text-primary';
    case 'poor':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Listing mode badge configuration
 * Used in: ListingCard, EnhancedListingCard
 */
export function getListingModeBadges(mode?: 'rent' | 'sale' | 'both'): Array<BadgeColorConfig> {
  const badges: Array<BadgeColorConfig> = [];

  if (!mode) return badges;

  if (mode === 'rent' || mode === 'both') {
    badges.push({
      className: 'text-xs',
      variant: 'secondary',
    });
  }

  if (mode === 'sale' || mode === 'both') {
    badges.push({
      className: 'text-xs',
      variant: 'outline',
    });
  }

  return badges;
}

/**
 * Generation type badge configuration
 * Used in: GenerationCard
 */
export function getGenerationTypeBadge(isVideo: boolean, imageCount: number): BadgeColorConfig | null {
  if (isVideo) {
    return {
      className: 'bg-black/70 text-white border-0',
      variant: 'secondary',
    };
  }

  if (imageCount > 1) {
    return {
      className: 'bg-black/70 text-white border-0',
      variant: 'secondary',
    };
  }

  return null;
}

/**
 * Status badge colors (generic)
 * Used across multiple components
 */
export function getStatusBadgeColor(status: string): string {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case 'active':
    case 'approved':
    case 'completed':
    case 'success':
      return 'bg-primary/10 text-primary ring-primary/20';

    case 'pending':
    case 'in_progress':
    case 'processing':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20';

    case 'inactive':
    case 'rejected':
    case 'failed':
    case 'error':
      return 'bg-destructive/10 text-destructive ring-destructive/20';

    case 'draft':
    case 'archived':
      return 'bg-muted text-muted-foreground ring-border';

    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Priority badge colors (generic)
 * Used for priority/urgency indicators
 */
export function getPriorityBadgeColor(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
  switch (priority) {
    case 'low':
      return 'bg-muted text-muted-foreground ring-border';
    case 'medium':
      return 'bg-secondary text-secondary-foreground ring-border';
    case 'high':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-orange-500/20';
    case 'urgent':
      return 'bg-destructive/10 text-destructive ring-destructive/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Subscription tier badge colors
 * Used in: ProfileCard, subscription components
 */
export function getSubscriptionTierColor(tier: string): string {
  const normalizedTier = tier.toLowerCase();

  switch (normalizedTier) {
    case 'free':
    case 'basic':
      return 'bg-muted text-muted-foreground ring-border';

    case 'pro':
    case 'premium':
      return 'bg-secondary text-secondary-foreground ring-border';

    case 'enterprise':
    case 'business':
      return 'bg-primary/10 text-primary ring-primary/20';

    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Category badge colors (generic)
 * Used for general category tagging across the app
 */
export function getCategoryBadgeColor(category: string): string {
  // Hash the category string to get a consistent color
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  ];

  return colors[Math.abs(hash) % colors.length];
}
