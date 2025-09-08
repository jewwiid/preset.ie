import { Gig, EntityId, Compensation, Location } from '@preset/domain';
import { GigRepository } from '../../ports/repositories/gig-repository';
import { UserRepository } from '../../ports/repositories/user-repository';
import { EventBus } from '../../ports/services/event-bus';

export interface CreateGigCommand {
  ownerUserId: string;
  title: string;
  description: string;
  compensation: {
    type: 'TFP' | 'PAID' | 'EXPENSES';
    details?: string;
  };
  location: {
    text: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
  };
  startTime: Date;
  endTime: Date;
  applicationDeadline: Date;
  maxApplicants: number;
  usageRights: string;
  safetyNotes?: string;
}

export class CreateGigUseCase {
  constructor(
    private gigRepository: GigRepository,
    private userRepository: UserRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CreateGigCommand): Promise<{ gigId: string }> {
    // Check user exists and can create gigs
    const user = await this.userRepository.findByUserId(command.ownerUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.roles.isContributor()) {
      throw new Error('User must be a contributor to create gigs');
    }

    // Check subscription limits
    const currentGigCount = await this.gigRepository.countByOwner(
      EntityId.from(user.id.toString()),
      'PUBLISHED'
    );

    if (!user.canCreateGig(currentGigCount)) {
      throw new Error('Gig creation limit reached for current subscription tier');
    }

    // Create compensation value object
    const compensation = command.compensation.type === 'TFP' 
      ? Compensation.tfp()
      : command.compensation.type === 'PAID'
      ? Compensation.paid(command.compensation.details)
      : Compensation.expenses(command.compensation.details);

    // Create location value object  
    const location = new Location(
      command.location.text,
      command.location.latitude,
      command.location.longitude,
      command.location.radiusMeters
    );

    // Create the gig
    const gig = Gig.create(
      EntityId.from(user.id.toString()),
      command.title,
      command.description,
      compensation,
      location,
      command.startTime,
      command.endTime,
      command.applicationDeadline,
      command.maxApplicants,
      command.usageRights,
      command.safetyNotes
    );

    // Save the gig
    await this.gigRepository.save(gig);

    // Publish domain events
    const events = gig.getEvents();
    await this.eventBus.publishMany(events);
    gig.clearEvents();

    return { gigId: gig.id.toString() };
  }
}