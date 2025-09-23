export enum SubscriptionTier {
  FREE = 'FREE',
  PLUS = 'PLUS',
  PRO = 'PRO'
}

export class Subscription {
  constructor(
    public readonly tier: SubscriptionTier,
    public readonly status: SubscriptionStatus,
    public readonly startedAt: Date,
    public readonly expiresAt?: Date
  ) {}

  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE &&
           (!this.expiresAt || this.expiresAt > new Date());
  }

  canApply(currentApplicationCount: number): boolean {
    switch (this.tier) {
      case SubscriptionTier.FREE:
        return currentApplicationCount < 3;
      case SubscriptionTier.PLUS:
      case SubscriptionTier.PRO:
        return true;
      default:
        return false;
    }
  }

  canCreateGig(currentGigCount: number): boolean {
    switch (this.tier) {
      case SubscriptionTier.FREE:
        return currentGigCount < 2;
      case SubscriptionTier.PLUS:
      case SubscriptionTier.PRO:
        return true;
      default:
        return false;
    }
  }

  maxShowcasesPerMonth(): number {
    switch (this.tier) {
      case SubscriptionTier.FREE:
        return 3;
      case SubscriptionTier.PLUS:
        return 10;
      case SubscriptionTier.PRO:
        return -1; // unlimited
      default:
        return 0;
    }
  }

  // Keep the old method for backward compatibility, but mark as deprecated
  /** @deprecated Use maxShowcasesPerMonth() instead */
  maxShowcases(): number {
    return this.maxShowcasesPerMonth();
  }
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL'
}