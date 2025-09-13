import { UserRepository, EventBus } from '@preset/domain';

export interface VerifyUserCommand {
  userId: string;
  verificationType: 'email' | 'phone' | 'id';
  verificationMethod?: string;
}

/**
 * Use case for verifying a user
 */
export class VerifyUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private eventBus?: EventBus
  ) {}

  async execute(command: VerifyUserCommand): Promise<void> {
    // Get user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Perform verification based on type
    switch (command.verificationType) {
      case 'email':
        user.verifyEmail();
        break;
      
      case 'phone':
        user.verifyPhone();
        break;
      
      case 'id':
        user.verifyId(command.verificationMethod);
        break;
      
      default:
        throw new Error(`Unknown verification type: ${command.verificationType}`);
    }

    // Save user
    await this.userRepository.save(user);

    // Publish events
    if (this.eventBus) {
      const events = user.getUncommittedEvents();
      await this.eventBus.publishAll(events);
      user.markEventsAsCommitted();
    }
  }
}