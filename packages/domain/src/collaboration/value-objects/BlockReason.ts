/**
 * Reasons why a user might block another user
 */
export enum BlockReason {
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  UNPROFESSIONAL_BEHAVIOR = 'unprofessional_behavior',
  NO_SHOW = 'no_show',
  PAYMENT_DISPUTE = 'payment_dispute',
  PRIVACY_VIOLATION = 'privacy_violation',
  OTHER = 'other'
}

/**
 * Get human-readable label for block reason
 */
export function getBlockReasonLabel(reason: BlockReason): string {
  switch (reason) {
    case BlockReason.HARASSMENT:
      return 'Harassment or bullying';
    case BlockReason.SPAM:
      return 'Spam messages';
    case BlockReason.INAPPROPRIATE_CONTENT:
      return 'Inappropriate content';
    case BlockReason.UNPROFESSIONAL_BEHAVIOR:
      return 'Unprofessional behavior';
    case BlockReason.NO_SHOW:
      return 'No-show to scheduled shoot';
    case BlockReason.PAYMENT_DISPUTE:
      return 'Payment or compensation dispute';
    case BlockReason.PRIVACY_VIOLATION:
      return 'Privacy violation or unauthorized use';
    case BlockReason.OTHER:
      return 'Other reason';
    default:
      return 'Unknown reason';
  }
}

/**
 * Value object for block reason with optional details
 */
export class BlockReasonDetails {
  constructor(
    private readonly reason: BlockReason,
    private readonly details?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.details && this.details.length > 500) {
      throw new Error('Block reason details cannot exceed 500 characters');
    }

    if (this.details && this.details.trim().length === 0) {
      throw new Error('Block reason details cannot be empty');
    }
  }

  getReason(): BlockReason {
    return this.reason;
  }

  getDetails(): string | undefined {
    return this.details;
  }

  getLabel(): string {
    return getBlockReasonLabel(this.reason);
  }

  getFullDescription(): string {
    const label = this.getLabel();
    return this.details ? `${label}: ${this.details}` : label;
  }

  toJSON() {
    return {
      reason: this.reason,
      details: this.details,
      label: this.getLabel()
    };
  }

  equals(other: BlockReasonDetails): boolean {
    return this.reason === other.reason && this.details === other.details;
  }
}