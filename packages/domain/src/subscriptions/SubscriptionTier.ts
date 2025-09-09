/**
 * Value object representing subscription tiers
 */
export enum SubscriptionTier {
  FREE = 'free',
  PLUS = 'plus',
  PRO = 'pro'
}

/**
 * Subscription limits for each tier
 */
export interface TierLimits {
  gigsPerMonth: number;
  applicationsPerMonth: number;
  showcasesTotal: number;
  applicantsPerGig: number;
  aiEnhancements: boolean;
  moodboardVideos: boolean;
  boostGigs: boolean;
  teamAccess: boolean;
  verifiedBadge: boolean;
  prioritySupport: boolean;
}

/**
 * Subscription limits configuration
 */
export const SubscriptionLimits: Record<SubscriptionTier, TierLimits> = {
  [SubscriptionTier.FREE]: {
    gigsPerMonth: 2,
    applicationsPerMonth: 3,
    showcasesTotal: 3,
    applicantsPerGig: 10,
    aiEnhancements: false,
    moodboardVideos: false,
    boostGigs: false,
    teamAccess: false,
    verifiedBadge: false,
    prioritySupport: false
  },
  [SubscriptionTier.PLUS]: {
    gigsPerMonth: Infinity,
    applicationsPerMonth: Infinity,
    showcasesTotal: 10,
    applicantsPerGig: 50,
    aiEnhancements: true,
    moodboardVideos: true,
    boostGigs: false,
    teamAccess: false,
    verifiedBadge: true,
    prioritySupport: false
  },
  [SubscriptionTier.PRO]: {
    gigsPerMonth: Infinity,
    applicationsPerMonth: Infinity,
    showcasesTotal: Infinity,
    applicantsPerGig: Infinity,
    aiEnhancements: true,
    moodboardVideos: true,
    boostGigs: true,
    teamAccess: true,
    verifiedBadge: true,
    prioritySupport: true
  }
};

/**
 * Pricing for each tier (in cents)
 */
export const SubscriptionPricing = {
  [SubscriptionTier.FREE]: {
    monthly: 0,
    yearly: 0
  },
  [SubscriptionTier.PLUS]: {
    talentMonthly: 900,  // €9
    talentYearly: 9000,  // €90 (2 months free)
    contributorMonthly: 1200,  // €12
    contributorYearly: 12000   // €120 (2 months free)
  },
  [SubscriptionTier.PRO]: {
    talentMonthly: 1900,  // €19
    talentYearly: 19000,  // €190 (2 months free)
    contributorMonthly: 2400,  // €24
    contributorYearly: 24000   // €240 (2 months free)
  }
};