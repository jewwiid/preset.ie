import { Application } from '@preset/domain/applications/entities/Application';
import { ApplicationRepository } from '@preset/domain/applications/ports/ApplicationRepository';
import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { UserRepository } from '@preset/domain/identity/ports/UserRepository';
import { ProfileRepository } from '@preset/domain/identity/ports/ProfileRepository';
import { EventBus } from '@preset/domain/shared/EventBus';
import { IdGenerator } from '@preset/domain/shared/IdGenerator';
import { SubscriptionEnforcer } from '../../shared/SubscriptionEnforcer';
import { GigStatus } from '@preset/domain/gigs/value-objects/GigStatus';

export interface ApplyToGigCommand {
  gigId: string;
  applicantId: string;
  note?: string;
}

export interface ApplyToGigResult {
  applicationId: string;
  status: 'success' | 'already_applied' | 'gig_not_accepting' | 'subscription_limit';
  message?: string;
}

export class ApplyToGigUseCase {
  constructor(
    private applicationRepo: ApplicationRepository,
    private gigRepo: GigRepository,
    private userRepo: UserRepository,
    private profileRepo: ProfileRepository,
    private subscriptionEnforcer: SubscriptionEnforcer,
    private eventBus: EventBus,
    private idGenerator: IdGenerator
  ) {}

  async execute(command: ApplyToGigCommand): Promise<ApplyToGigResult> {
    // Check if already applied
    const existingApplication = await this.applicationRepo.findByGigAndApplicant(
      command.gigId,
      command.applicantId
    );

    if (existingApplication) {
      return {
        applicationId: existingApplication.getId(),
        status: 'already_applied',
        message: 'You have already applied to this gig'
      };
    }

    // Get the gig
    const gig = await this.gigRepo.findById(command.gigId);
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Check if gig is accepting applications
    if (gig.getStatus() !== GigStatus.PUBLISHED) {
      return {
        applicationId: '',
        status: 'gig_not_accepting',
        message: 'This gig is not accepting applications'
      };
    }

    // Check if gig has reached max applicants
    const applicationCount = await this.applicationRepo.countByGig(command.gigId);
    if (gig.getMaxApplicants() && applicationCount >= gig.getMaxApplicants()) {
      return {
        applicationId: '',
        status: 'gig_not_accepting',
        message: 'This gig has reached the maximum number of applicants'
      };
    }

    // Check if application deadline has passed
    if (gig.getApplicationDeadline() && gig.getApplicationDeadline() < new Date()) {
      return {
        applicationId: '',
        status: 'gig_not_accepting',
        message: 'The application deadline has passed'
      };
    }

    // Get user and check subscription limits
    const user = await this.userRepo.findById(command.applicantId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check subscription limits for applications
    try {
      await this.subscriptionEnforcer.enforceApplication(
        user.getId(),
        user.getSubscriptionTier()
      );
    } catch (error) {
      return {
        applicationId: '',
        status: 'subscription_limit',
        message: error instanceof Error ? error.message : 'Subscription limit reached'
      };
    }

    // Get applicant's profile for snapshot
    const profile = await this.profileRepo.findByUserId(command.applicantId);
    
    // Create profile snapshot
    const profileSnapshot = profile ? {
      displayName: profile.getDisplayName(),
      handle: profile.getHandle(),
      avatarUrl: profile.getAvatarUrl(),
      bio: profile.getBio(),
      city: profile.getCity(),
      styleTags: profile.getStyleTags(),
      showcaseCount: profile.getShowcaseIds().length,
      averageRating: undefined // TODO: Get from reviews when implemented
    } : undefined;

    // Create the application
    const application = Application.create({
      id: this.idGenerator.generate(),
      gigId: command.gigId,
      applicantId: command.applicantId,
      note: command.note,
      profileSnapshot
    });

    // Save the application
    await this.applicationRepo.save(application);

    // Publish domain events
    const events = application.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    application.markEventsAsCommitted();

    return {
      applicationId: application.getId(),
      status: 'success',
      message: 'Application submitted successfully'
    };
  }
}