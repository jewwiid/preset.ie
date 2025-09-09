import { Gig } from '@preset/domain/gigs/entities/Gig';
import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { UserRepository } from '@preset/domain/identity/ports/UserRepository';
import { CompensationType } from '@preset/domain/gigs/value-objects/CompensationType';
import { SubscriptionEnforcer } from '../../shared/SubscriptionEnforcer';
import { EventBus } from '@preset/domain/shared/ports/EventBus';

export interface CreateGigCommand {
  ownerId: string;
  title: string;
  description: string;
  purpose?: string;
  compensationType: CompensationType;
  compensationAmount?: number;
  compensationDetails?: string;
  locationText: string;
  locationLat?: number;
  locationLng?: number;
  locationRadius?: number;
  startTime: Date;
  endTime: Date;
  usageRights: string;
  safetyNotes?: string;
  applicationDeadline: Date;
  maxApplicants: number;
  tags?: string[];
}

/**
 * Use case for creating a new gig
 */
export class CreateGigUseCase {
  private subscriptionEnforcer: SubscriptionEnforcer;

  constructor(
    private gigRepository: GigRepository,
    private userRepository: UserRepository,
    private eventBus?: EventBus
  ) {
    this.subscriptionEnforcer = new SubscriptionEnforcer();
  }

  async execute(command: CreateGigCommand): Promise<{ gigId: string }> {
    // Get user and verify they exist
    const user = await this.userRepository.findById(command.ownerId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is a contributor
    if (user.role !== 'contributor') {
      throw new Error('Only contributors can create gigs');
    }

    // Check subscription limits
    await this.subscriptionEnforcer.enforceGigCreation(
      user.subscriptionTier,
      command.ownerId,
      this.gigRepository
    );

    // Validate dates
    if (command.startTime <= new Date()) {
      throw new Error('Start time must be in the future');
    }

    if (command.applicationDeadline >= command.startTime) {
      throw new Error('Application deadline must be before start time');
    }

    // Validate max applicants based on subscription
    const policy = this.subscriptionEnforcer.getPolicy();
    const maxAllowed = policy.getMaxApplicantsPerGig(user.subscriptionTier);
    
    if (command.maxApplicants > maxAllowed) {
      throw new Error(`Your subscription tier allows maximum ${maxAllowed} applicants per gig`);
    }

    // Create the gig
    const gig = Gig.create({
      ownerId: command.ownerId,
      title: command.title,
      description: command.description,
      purpose: command.purpose,
      compensationType: command.compensationType,
      compensationAmount: command.compensationAmount,
      compensationDetails: command.compensationDetails,
      locationText: command.locationText,
      locationLat: command.locationLat,
      locationLng: command.locationLng,
      locationRadius: command.locationRadius,
      startTime: command.startTime,
      endTime: command.endTime,
      usageRights: command.usageRights,
      safetyNotes: command.safetyNotes,
      applicationDeadline: command.applicationDeadline,
      maxApplicants: command.maxApplicants,
      tags: command.tags
    });

    // Save to repository
    await this.gigRepository.save(gig);

    // Publish domain events
    if (this.eventBus) {
      const events = gig.getUncommittedEvents();
      await this.eventBus.publishAll(events);
      gig.markEventsAsCommitted();
    }

    return { gigId: gig.id };
  }
}