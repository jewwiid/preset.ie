import { EventHandler } from '../../shared/EventHandler';
import { DomainEvent } from '@preset/domain/shared/DomainEvent';
import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { UserRepository } from '@preset/domain/identity/ports/UserRepository';

export interface ApplicationSubmittedEvent extends DomainEvent {
  eventType: 'ApplicationSubmitted';
  payload: {
    applicationId: string;
    gigId: string;
    applicantId: string;
    appliedAt: Date;
  };
}

/**
 * Handler for ApplicationSubmitted events
 * Notifies gig owner and updates statistics
 */
export class ApplicationSubmittedHandler implements EventHandler<ApplicationSubmittedEvent> {
  eventType = 'ApplicationSubmitted';

  constructor(
    private gigRepo: GigRepository,
    private userRepo: UserRepository,
    private notificationService?: {
      sendApplicationNotification(ownerId: string, gigTitle: string, applicantName: string): Promise<void>;
    }
  ) {}

  async handle(event: ApplicationSubmittedEvent): Promise<void> {
    const { gigId, applicantId } = event.payload;

    // Get gig details
    const gig = await this.gigRepo.findById(gigId);
    if (!gig) {
      console.error(`Gig ${gigId} not found for application`);
      return;
    }

    // Increment application count for statistics
    await this.gigRepo.incrementApplicationCount(gigId);

    // Get applicant details
    const applicant = await this.userRepo.findById(applicantId);
    if (!applicant) {
      console.error(`Applicant ${applicantId} not found`);
      return;
    }

    // Send notification to gig owner
    if (this.notificationService) {
      try {
        await this.notificationService.sendApplicationNotification(
          gig.getOwnerId(),
          gig.getTitle(),
          applicant.getEmail()
        );
      } catch (error) {
        console.error('Failed to send application notification:', error);
      }
    }

    console.log(`Application submitted for gig ${gig.getTitle()} by ${applicant.getEmail()}`);
  }
}