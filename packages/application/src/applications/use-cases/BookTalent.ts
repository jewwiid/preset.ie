import { ApplicationRepository, GigRepository, EventBus, GigStatus, EntityId } from '@preset/domain';

export interface BookTalentCommand {
  applicationId: string;
  gigOwnerId: string;
}

export interface BookTalentResult {
  success: boolean;
  gigId: string;
  talentId: string;
  message: string;
}

export class BookTalentUseCase {
  constructor(
    private applicationRepo: ApplicationRepository,
    private gigRepo: GigRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: BookTalentCommand): Promise<BookTalentResult> {
    // Get the application
    const application = await this.applicationRepo.findById(command.applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Get the gig
    const gig = await this.gigRepo.findById(application.getGigId());
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Verify the requester is the gig owner
    if (gig.ownerId.toString() !== command.gigOwnerId) {
      throw new Error('Only the gig owner can book talent');
    }

    // Check if gig is already booked
    if (gig.status === GigStatus.BOOKED) {
      return {
        success: false,
        gigId: gig.getId(),
        talentId: '',
        message: 'This gig already has talent booked'
      };
    }

    // Check if gig can be booked
    if (gig.status !== GigStatus.PUBLISHED && gig.status !== GigStatus.CLOSED) {
      return {
        success: false,
        gigId: gig.getId(),
        talentId: '',
        message: `Cannot book talent for a gig with status: ${gig.status}`
      };
    }

    // Check if application is eligible for booking
    if (application.isFinalized()) {
      return {
        success: false,
        gigId: gig.getId(),
        talentId: application.getApplicantId(),
        message: `Application is already ${application.getStatus()}`
      };
    }

    try {
      // Accept the application
      application.accept();
      await this.applicationRepo.save(application);

      // Book the gig
      gig.book([EntityId.from(application.getApplicantId())]);
      await this.gigRepo.save(gig);

      // Auto-decline all other pending/shortlisted applications
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

      // Publish events for the accepted application
      const applicationEvents = application.getUncommittedEvents();
      for (const event of applicationEvents) {
        await this.eventBus.publish(event);
      }
      application.markEventsAsCommitted();

      // Publish events for the booked gig
      const gigEvents = gig.getUncommittedEvents();
      for (const event of gigEvents) {
        await this.eventBus.publish(event);
      }
      gig.markEventsAsCommitted();

      return {
        success: true,
        gigId: gig.getId(),
        talentId: application.getApplicantId(),
        message: 'Talent booked successfully'
      };
    } catch (error) {
      return {
        success: false,
        gigId: gig.getId(),
        talentId: application.getApplicantId(),
        message: error instanceof Error ? error.message : 'Failed to book talent'
      };
    }
  }
}