import { SubscriptionTier } from './SubscriptionTier';

/**
 * Exception thrown when a subscription limit is exceeded
 */
export class SubscriptionLimitExceeded extends Error {
  constructor(
    message: string,
    public readonly currentTier: SubscriptionTier,
    public readonly requiredTier?: SubscriptionTier,
    public readonly operation?: string
  ) {
    super(message);
    this.name = 'SubscriptionLimitExceeded';
  }

  /**
   * Create a standard limit exceeded error
   */
  static forOperation(
    operation: string,
    currentTier: SubscriptionTier,
    requiredTier: SubscriptionTier,
    customMessage?: string
  ): SubscriptionLimitExceeded {
    const message = customMessage || 
      `This operation requires ${requiredTier} subscription. Current tier: ${currentTier}`;
    
    return new SubscriptionLimitExceeded(message, currentTier, requiredTier, operation);
  }

  /**
   * Create an error for monthly limit exceeded
   */
  static monthlyLimitReached(
    resource: string,
    limit: number,
    currentTier: SubscriptionTier
  ): SubscriptionLimitExceeded {
    const message = `Monthly limit of ${limit} ${resource} reached for ${currentTier} tier`;
    return new SubscriptionLimitExceeded(message, currentTier, undefined, resource);
  }

  /**
   * Create an error for total limit exceeded
   */
  static totalLimitReached(
    resource: string,
    limit: number,
    currentTier: SubscriptionTier
  ): SubscriptionLimitExceeded {
    const message = `Total limit of ${limit} ${resource} reached for ${currentTier} tier`;
    return new SubscriptionLimitExceeded(message, currentTier, undefined, resource);
  }

  /**
   * Get user-friendly error response
   */
  toUserResponse() {
    return {
      error: 'subscription_limit_exceeded',
      message: this.message,
      currentTier: this.currentTier,
      requiredTier: this.requiredTier,
      upgradeRequired: true
    };
  }
}