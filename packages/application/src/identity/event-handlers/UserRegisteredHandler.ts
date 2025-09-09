import { EventHandler } from '../../shared/EventHandler';
import { DomainEvent } from '@preset/domain/shared/DomainEvent';
import { ProfileRepository } from '@preset/domain/identity/ports/ProfileRepository';
import { Profile } from '@preset/domain/identity/entities/Profile';
import { IdGenerator } from '@preset/domain/shared/IdGenerator';

export interface UserRegisteredEvent extends DomainEvent {
  eventType: 'UserRegistered';
  payload: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Handler for UserRegistered events
 * Creates a default profile for new users
 */
export class UserRegisteredHandler implements EventHandler<UserRegisteredEvent> {
  eventType = 'UserRegistered';

  constructor(
    private profileRepo: ProfileRepository,
    private idGenerator: IdGenerator,
    private emailService?: { sendWelcomeEmail(email: string, role: string): Promise<void> }
  ) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    const { userId, email, role } = event.payload;

    // Check if profile already exists
    const existingProfile = await this.profileRepo.findByUserId(userId);
    if (existingProfile) {
      console.log(`Profile already exists for user ${userId}`);
      return;
    }

    // Generate a unique handle from email
    const baseHandle = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let handle = baseHandle;
    let suffix = 1;

    // Ensure handle is unique
    while (await this.profileRepo.findByHandle(handle)) {
      handle = `${baseHandle}${suffix}`;
      suffix++;
    }

    // Create default profile
    const profile = Profile.create({
      id: this.idGenerator.generate(),
      userId,
      handle,
      displayName: email.split('@')[0], // Default display name
      bio: '',
      city: '',
      styleTags: [],
      showcaseIds: []
    });

    // Save profile
    await this.profileRepo.save(profile);

    // Send welcome email if service is available
    if (this.emailService) {
      try {
        await this.emailService.sendWelcomeEmail(email, role);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't throw - email failure shouldn't break the flow
      }
    }

    console.log(`Created profile for new user ${userId} with handle ${handle}`);
  }
}