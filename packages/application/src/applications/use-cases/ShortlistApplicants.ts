import { ApplicationRepository } from '@preset/domain/applications/ports/ApplicationRepository';
import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { UserRepository } from '@preset/domain/identity/ports/UserRepository';
import { EventBus } from '@preset/domain/shared/EventBus';
import { SubscriptionEnforcer } from '../../shared/SubscriptionEnforcer';

export interface ShortlistApplicantsCommand {
  gigId: string;
  applicationIds: string[];
  reviewerId: string;
}

export interface ShortlistApplicantsResult {
  shortlisted: string[];
  failed: Array<{
    applicationId: string;
    reason: string;
  }>;
  totalShortlisted: number;
}

export class ShortlistApplicantsUseCase {
  constructor(
    private applicationRepo: ApplicationRepository,
    private gigRepo: GigRepository,
    private userRepo: UserRepository,
    private subscriptionEnforcer: SubscriptionEnforcer,
    private eventBus: EventBus
  ) {}

  async execute(command: ShortlistApplicantsCommand): Promise<ShortlistApplicantsResult> {
    // Get the gig
    const gig = await this.gigRepo.findById(command.gigId);
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Verify the reviewer is the gig owner
    if (gig.getOwnerId() !== command.reviewerId) {
      throw new Error('Only the gig owner can shortlist applicants');
    }

    // Get the gig owner's subscription tier for bulk operations
    const owner = await this.userRepo.findById(command.reviewerId);
    if (!owner) {
      throw new Error('User not found');
    }

    // Check if user can perform bulk shortlisting (Plus/Pro feature)
    const canBulkShortlist = await this.subscriptionEnforcer.canBulkShortlist(
      owner.getSubscriptionTier()
    );

    if (command.applicationIds.length > 1 && !canBulkShortlist) {
      throw new Error('Bulk shortlisting requires Plus or Pro subscription');
    }

    const shortlisted: string[] = [];
    const failed: Array<{ applicationId: string; reason: string }> = [];

    // Process each application
    for (const applicationId of command.applicationIds) {
      try {
        const application = await this.applicationRepo.findById(applicationId);
        
        if (!application) {
          failed.push({
            applicationId,
            reason: 'Application not found'
          });
          continue;
        }

        // Verify the application belongs to this gig
        if (application.getGigId() !== command.gigId) {
          failed.push({
            applicationId,
            reason: 'Application does not belong to this gig'
          });
          continue;
        }

        // Check if already shortlisted or finalized
        if (application.isShortlisted()) {
          shortlisted.push(applicationId); // Already shortlisted, count as success
          continue;
        }

        if (application.isFinalized()) {
          failed.push({
            applicationId,
            reason: `Application is already ${application.getStatus()}`
          });
          continue;
        }

        // Shortlist the application
        application.shortlist();
        await this.applicationRepo.save(application);

        // Publish domain events
        const events = application.getUncommittedEvents();
        for (const event of events) {
          await this.eventBus.publish(event);
        }
        application.markEventsAsCommitted();

        shortlisted.push(applicationId);
      } catch (error) {
        failed.push({
          applicationId,
          reason: error instanceof Error ? error.message : 'Failed to shortlist'
        });
      }
    }

    // Get total shortlisted count for this gig
    const totalShortlisted = await this.applicationRepo.countShortlistedByGig(command.gigId);

    return {
      shortlisted,
      failed,
      totalShortlisted
    };
  }
}