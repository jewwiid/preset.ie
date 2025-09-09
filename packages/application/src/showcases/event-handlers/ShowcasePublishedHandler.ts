import { EventHandler } from '../../shared/EventHandler';
import { DomainEvent } from '@preset/domain/shared/DomainEvent';
import { ProfileRepository } from '@preset/domain/identity/ports/ProfileRepository';
import { UserRepository } from '@preset/domain/identity/ports/UserRepository';

export interface ShowcasePublishedEvent extends DomainEvent {
  eventType: 'ShowcasePublished';
  payload: {
    showcaseId: string;
    gigId: string;
    creatorId: string;
    talentId: string;
  };
}

/**
 * Handler for ShowcasePublished events
 * Updates user profiles with showcase references
 */
export class ShowcasePublishedHandler implements EventHandler<ShowcasePublishedEvent> {
  eventType = 'ShowcasePublished';

  constructor(
    private profileRepo: ProfileRepository,
    private userRepo: UserRepository,
    private notificationService?: {
      sendShowcasePublishedNotification(
        creatorEmail: string,
        talentEmail: string,
        showcaseUrl: string
      ): Promise<void>;
    }
  ) {}

  async handle(event: ShowcasePublishedEvent): Promise<void> {
    const { showcaseId, creatorId, talentId } = event.payload;

    // Update both profiles with the showcase
    const [creatorProfile, talentProfile] = await Promise.all([
      this.profileRepo.findByUserId(creatorId),
      this.profileRepo.findByUserId(talentId)
    ]);

    if (creatorProfile) {
      // Get creator's subscription tier to check showcase limits
      const creator = await this.userRepo.findById(creatorId);
      if (creator) {
        try {
          creatorProfile.addShowcase(showcaseId, creator.getSubscriptionTier());
          await this.profileRepo.save(creatorProfile);
        } catch (error) {
          console.error(`Failed to add showcase to creator profile: ${error}`);
        }
      }
    }

    if (talentProfile) {
      // Get talent's subscription tier to check showcase limits
      const talent = await this.userRepo.findById(talentId);
      if (talent) {
        try {
          talentProfile.addShowcase(showcaseId, talent.getSubscriptionTier());
          await this.profileRepo.save(talentProfile);
        } catch (error) {
          console.error(`Failed to add showcase to talent profile: ${error}`);
        }
      }
    }

    // Send notifications
    if (this.notificationService) {
      const [creator, talent] = await Promise.all([
        this.userRepo.findById(creatorId),
        this.userRepo.findById(talentId)
      ]);

      if (creator && talent) {
        const showcaseUrl = `/showcases/${showcaseId}`;
        try {
          await this.notificationService.sendShowcasePublishedNotification(
            creator.getEmail(),
            talent.getEmail(),
            showcaseUrl
          );
        } catch (error) {
          console.error('Failed to send showcase published notification:', error);
        }
      }
    }

    console.log(`Showcase ${showcaseId} published and added to user profiles`);
  }
}