import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { UserRepository } from '@preset/domain/identity/ports/UserRepository';
import { MoodboardRepository } from '@preset/domain/moodboards/ports/MoodboardRepository';
import { EventBus } from '@preset/domain/shared/ports/EventBus';

export interface PublishGigCommand {
  gigId: string;
  userId: string;
  moodboardId?: string;
}

/**
 * Use case for publishing a gig
 */
export class PublishGigUseCase {
  constructor(
    private gigRepository: GigRepository,
    private userRepository: UserRepository,
    private moodboardRepository: MoodboardRepository,
    private eventBus?: EventBus
  ) {}

  async execute(command: PublishGigCommand): Promise<void> {
    // Get gig
    const gig = await this.gigRepository.findById(command.gigId);
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Verify user owns the gig
    if (gig.ownerId !== command.userId) {
      throw new Error('You do not have permission to publish this gig');
    }

    // Attach moodboard if provided
    if (command.moodboardId) {
      // Verify moodboard exists and belongs to user
      const moodboard = await this.moodboardRepository.findById(command.moodboardId);
      if (!moodboard) {
        throw new Error('Moodboard not found');
      }

      if (moodboard.ownerId !== command.userId) {
        throw new Error('You do not have permission to use this moodboard');
      }

      gig.attachMoodboard(command.moodboardId);
    }

    // Publish the gig
    gig.publish();

    // Save changes
    await this.gigRepository.save(gig);

    // Publish domain events
    if (this.eventBus) {
      const events = gig.getUncommittedEvents();
      await this.eventBus.publishAll(events);
      gig.markEventsAsCommitted();
    }
  }
}