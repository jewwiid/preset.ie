import { SubscriptionPolicy } from '@preset/domain/subscriptions/SubscriptionPolicy';
import { SubscriptionTier } from '@preset/domain/subscriptions/SubscriptionTier';
import { SubscriptionLimitExceeded } from '@preset/domain/subscriptions/SubscriptionLimitExceeded';

/**
 * Application service for enforcing subscription limits
 * This wraps the domain SubscriptionPolicy with repository queries
 */
export class SubscriptionEnforcer {
  private policy: SubscriptionPolicy;

  constructor() {
    this.policy = new SubscriptionPolicy();
  }

  /**
   * Check if user can create a gig
   */
  async enforceGigCreation(
    userTier: SubscriptionTier,
    userId: string,
    gigRepository: { countByUserThisMonth(userId: string): Promise<number> }
  ): Promise<void> {
    const gigsThisMonth = await gigRepository.countByUserThisMonth(userId);
    
    if (!this.policy.canCreateGig(userTier, gigsThisMonth)) {
      const limits = this.policy.getTierLimits(userTier);
      throw SubscriptionLimitExceeded.monthlyLimitReached(
        'gigs',
        limits.gigsPerMonth,
        userTier
      );
    }
  }

  /**
   * Check if user can apply to a gig
   */
  async enforceApplication(
    userTier: SubscriptionTier,
    userId: string,
    applicationRepository: { countByApplicantThisMonth(userId: string): Promise<number> }
  ): Promise<void> {
    const applicationsThisMonth = await applicationRepository.countByApplicantThisMonth(userId);
    
    if (!this.policy.canApplyToGig(userTier, applicationsThisMonth)) {
      const limits = this.policy.getTierLimits(userTier);
      throw SubscriptionLimitExceeded.monthlyLimitReached(
        'applications',
        limits.applicationsPerMonth,
        userTier
      );
    }
  }

  /**
   * Check if user can create a showcase
   */
  async enforceShowcaseCreation(
    userTier: SubscriptionTier,
    userId: string,
    showcaseRepository: { countByUserId(userId: string): Promise<number> }
  ): Promise<void> {
    const totalShowcases = await showcaseRepository.countByUserId(userId);
    
    if (!this.policy.canCreateShowcase(userTier, totalShowcases)) {
      const limits = this.policy.getTierLimits(userTier);
      throw SubscriptionLimitExceeded.totalLimitReached(
        'showcases',
        limits.showcasesTotal,
        userTier
      );
    }
  }

  /**
   * Check if user can use AI enhancements
   */
  enforceAIEnhancements(userTier: SubscriptionTier): void {
    if (!this.policy.canUseAIEnhancements(userTier)) {
      throw SubscriptionLimitExceeded.forOperation(
        'aiEnhancements',
        userTier,
        SubscriptionTier.PLUS,
        'AI enhancements require Plus or Pro subscription'
      );
    }
  }

  /**
   * Check if user can add videos to moodboards
   */
  enforceMoodboardVideos(userTier: SubscriptionTier): void {
    if (!this.policy.canAddMoodboardVideos(userTier)) {
      throw SubscriptionLimitExceeded.forOperation(
        'moodboardVideos',
        userTier,
        SubscriptionTier.PLUS,
        'Video moodboards require Plus or Pro subscription'
      );
    }
  }

  /**
   * Check if user can boost a gig
   */
  enforceGigBoosting(userTier: SubscriptionTier): void {
    if (!this.policy.canBoostGig(userTier)) {
      throw SubscriptionLimitExceeded.forOperation(
        'boostGig',
        userTier,
        SubscriptionTier.PRO,
        'Gig boosting requires Pro subscription'
      );
    }
  }

  /**
   * Check if gig can accept more applicants
   */
  enforceApplicantLimit(
    gigOwnerTier: SubscriptionTier,
    currentApplicants: number
  ): void {
    const maxApplicants = this.policy.getMaxApplicantsPerGig(gigOwnerTier);
    
    if (currentApplicants >= maxApplicants) {
      throw new SubscriptionLimitExceeded(
        `This gig has reached its maximum of ${maxApplicants} applicants for ${gigOwnerTier} tier`,
        gigOwnerTier
      );
    }
  }

  /**
   * Check if user can perform bulk shortlisting
   */
  async canBulkShortlist(userTier: SubscriptionTier): Promise<boolean> {
    // Bulk shortlisting is available for Plus and Pro tiers
    return userTier === SubscriptionTier.PLUS || userTier === SubscriptionTier.PRO;
  }

  /**
   * Get the subscription policy instance
   */
  getPolicy(): SubscriptionPolicy {
    return this.policy;
  }
}