import { UserRepository, SubscriptionTier, EventBus } from '@preset/domain';

export interface UpgradeSubscriptionCommand {
  userId: string;
  newTier: SubscriptionTier;
  expiresAt?: Date;
  paymentIntentId?: string;
}

/**
 * Use case for upgrading a user's subscription
 */
export class UpgradeSubscriptionUseCase {
  constructor(
    private userRepository: UserRepository,
    private eventBus?: EventBus
  ) {}

  async execute(command: UpgradeSubscriptionCommand): Promise<void> {
    // Get user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate tier upgrade
    const currentTier = user.subscriptionTier;
    if (currentTier === command.newTier) {
      throw new Error('Already on this subscription tier');
    }

    // For downgrades, check if it's allowed
    if (this.isDowngrade(currentTier, command.newTier)) {
      // Could add business logic here to prevent downgrades
      // or handle prorated refunds
    }

    // Update subscription
    user.updateSubscription(command.newTier, command.expiresAt);

    // Save user
    await this.userRepository.save(user);

    // Publish events
    if (this.eventBus) {
      const events = user.getUncommittedEvents();
      await this.eventBus.publishAll(events);
      user.markEventsAsCommitted();
    }
  }

  private isDowngrade(current: SubscriptionTier, next: SubscriptionTier): boolean {
    const tierOrder = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.PLUS]: 1,
      [SubscriptionTier.PRO]: 2
    };

    return tierOrder[next] < tierOrder[current];
  }
}