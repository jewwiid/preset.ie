import { SubscriptionTier, SubscriptionLimits } from './SubscriptionTier';

/**
 * Domain service for subscription business rules and policies
 */
export class SubscriptionPolicy {
  /**
   * Check if user can create a new gig
   */
  canCreateGig(tier: SubscriptionTier, gigsCreatedThisMonth: number): boolean {
    const limits = SubscriptionLimits[tier];
    return gigsCreatedThisMonth < limits.gigsPerMonth;
  }

  /**
   * Check if user can apply to a gig
   */
  canApplyToGig(tier: SubscriptionTier, applicationsThisMonth: number): boolean {
    const limits = SubscriptionLimits[tier];
    return applicationsThisMonth < limits.applicationsPerMonth;
  }

  /**
   * Check if user can create a showcase
   */
  canCreateShowcase(tier: SubscriptionTier, totalShowcases: number): boolean {
    const limits = SubscriptionLimits[tier];
    return totalShowcases < limits.showcasesTotal;
  }

  /**
   * Check if user can use AI enhancements
   */
  canUseAIEnhancements(tier: SubscriptionTier): boolean {
    return SubscriptionLimits[tier].aiEnhancements;
  }

  /**
   * Check if user can add videos to moodboards
   */
  canAddMoodboardVideos(tier: SubscriptionTier): boolean {
    return SubscriptionLimits[tier].moodboardVideos;
  }

  /**
   * Check if user can boost gigs
   */
  canBoostGig(tier: SubscriptionTier): boolean {
    return SubscriptionLimits[tier].boostGigs;
  }

  /**
   * Check if user can invite team members
   */
  canInviteTeamMembers(tier: SubscriptionTier): boolean {
    return SubscriptionLimits[tier].teamAccess;
  }

  /**
   * Get maximum applicants per gig
   */
  getMaxApplicantsPerGig(tier: SubscriptionTier): number {
    return SubscriptionLimits[tier].applicantsPerGig;
  }

  /**
   * Get all limits for a tier
   */
  getTierLimits(tier: SubscriptionTier) {
    return SubscriptionLimits[tier];
  }

  /**
   * Check if an operation requires upgrade
   */
  requiresUpgrade(
    currentTier: SubscriptionTier,
    operation: keyof typeof SubscriptionLimits[SubscriptionTier]
  ): boolean {
    const currentLimits = SubscriptionLimits[currentTier];
    
    // If it's a boolean feature, check if it's false
    if (typeof currentLimits[operation] === 'boolean') {
      return !currentLimits[operation];
    }
    
    // If it's a numeric limit and it's not Infinity, it might require upgrade
    if (typeof currentLimits[operation] === 'number') {
      return currentLimits[operation] !== Infinity;
    }
    
    return false;
  }

  /**
   * Get the minimum tier required for a feature
   */
  getMinimumTierForFeature(feature: keyof typeof SubscriptionLimits[SubscriptionTier]): SubscriptionTier {
    // Check each tier from lowest to highest
    const tiers = [SubscriptionTier.FREE, SubscriptionTier.PLUS, SubscriptionTier.PRO];
    
    for (const tier of tiers) {
      const limits = SubscriptionLimits[tier];
      
      // For boolean features
      if (typeof limits[feature] === 'boolean' && limits[feature]) {
        return tier;
      }
      
      // For numeric features (check if it's unlimited)
      if (typeof limits[feature] === 'number' && limits[feature] === Infinity) {
        return tier;
      }
    }
    
    return SubscriptionTier.PRO; // Default to highest tier
  }

  /**
   * Get upgrade message for a blocked operation
   */
  getUpgradeMessage(
    currentTier: SubscriptionTier,
    operation: string,
    context?: { current?: number; limit?: number }
  ): string {
    const limits = SubscriptionLimits[currentTier];
    
    switch (operation) {
      case 'createGig':
        return `You've reached your limit of ${limits.gigsPerMonth} gigs per month. Upgrade to Plus for unlimited gigs.`;
      
      case 'applyToGig':
        return `You've reached your limit of ${limits.applicationsPerMonth} applications per month. Upgrade to Plus for unlimited applications.`;
      
      case 'createShowcase':
        return `You've reached your limit of ${limits.showcasesTotal} showcases. Upgrade to ${limits.showcasesTotal < 10 ? 'Plus' : 'Pro'} for more.`;
      
      case 'aiEnhancements':
        return 'AI enhancements are available with Plus and Pro subscriptions.';
      
      case 'moodboardVideos':
        return 'Video moodboards are available with Plus and Pro subscriptions.';
      
      case 'boostGig':
        return 'Gig boosting is available with Pro subscription.';
      
      case 'teamAccess':
        return 'Team collaboration is available with Pro subscription.';
      
      default:
        return 'Upgrade your subscription to access this feature.';
    }
  }
}