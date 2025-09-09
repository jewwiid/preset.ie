import { ApplicationRepository } from '@preset/domain/applications/ports/ApplicationRepository';
import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { EventBus } from '@preset/domain/shared/EventBus';

export interface ReviewApplicationCommand {
  applicationId: string;
  reviewerId: string;
  action: 'accept' | 'decline' | 'shortlist';
}

export interface ReviewApplicationResult {
  success: boolean;
  message: string;
}

export class ReviewApplicationUseCase {
  constructor(
    private applicationRepo: ApplicationRepository,
    private gigRepo: GigRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ReviewApplicationCommand): Promise<ReviewApplicationResult> {
    // Get the application
    const application = await this.applicationRepo.findById(command.applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Get the gig to verify ownership
    const gig = await this.gigRepo.findById(application.getGigId());
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Verify the reviewer is the gig owner
    if (gig.getOwnerId() !== command.reviewerId) {
      throw new Error('Only the gig owner can review applications');
    }

    // Check if application is already finalized
    if (application.isFinalized()) {
      return {
        success: false,
        message: `Application is already ${application.getStatus()}`
      };
    }

    // Perform the action
    try {
      switch (command.action) {
        case 'shortlist':
          application.shortlist();
          break;
        
        case 'accept':
          // When accepting an application, we should also update the gig status
          application.accept();
          
          // Mark the gig as booked
          gig.book(application.getApplicantId());
          await this.gigRepo.save(gig);
          
          // Optionally decline other pending applications
          const otherApplications = await this.applicationRepo.findByGigId(gig.getId());
          for (const otherApp of otherApplications) {
            if (otherApp.getId() !== application.getId() && !otherApp.isFinalized()) {
              otherApp.decline();
              await this.applicationRepo.save(otherApp);
              
              // Publish events for declined applications
              const events = otherApp.getUncommittedEvents();
              for (const event of events) {
                await this.eventBus.publish(event);
              }
              otherApp.markEventsAsCommitted();
            }
          }
          break;
        
        case 'decline':
          application.decline();
          break;
        
        default:
          throw new Error(`Invalid action: ${command.action}`);
      }

      // Save the application
      await this.applicationRepo.save(application);

      // Publish domain events
      const events = application.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      application.markEventsAsCommitted();

      // Publish gig events if it was booked
      if (command.action === 'accept') {
        const gigEvents = gig.getUncommittedEvents();
        for (const event of gigEvents) {
          await this.eventBus.publish(event);
        }
        gig.markEventsAsCommitted();
      }

      return {
        success: true,
        message: `Application ${command.action}ed successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to review application'
      };
    }
  }
}