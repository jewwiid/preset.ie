import { Gig, GigRepository, UserRepository, CompensationType, EventBus, EntityId } from '@preset/domain';
import { SubscriptionEnforcer } from '../../shared/SubscriptionEnforcer';

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
    const gig = Gig.create(
      EntityId.from(command.ownerId),
      command.title,
      command.description,
      command.compensationType,
      command.locationText,
      command.startTime,
      command.endTime,
      command.applicationDeadline,
      command.maxApplicants,
      command.usageRights,
      command.safetyNotes
    );

    // Save to repository
    await this.gigRepository.save(gig);

    // Publish domain events
    if (this.eventBus) {
      const events = gig.getUncommittedEvents();
      await this.eventBus.publishAll(events);
      gig.markEventsAsCommitted();
    }

    return { gigId: gig.id.toString() };
  }
}