import { ProfileRepository, UserRepository, EventBus } from '@preset/domain';

export interface UpdateProfileCommand {
  userId: string;
  displayName?: string;
  bio?: string;
  city?: string;
  country?: string;
  website?: string;
  instagram?: string;
  avatarUrl?: string;
  styleTags?: string[];
}

/**
 * Use case for updating a user's profile
 */
export class UpdateProfileUseCase {
  constructor(
    private profileRepository: ProfileRepository,
    private userRepository: UserRepository,
    private eventBus?: EventBus
  ) {}

  async execute(command: UpdateProfileCommand): Promise<void> {
    // Verify user exists
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get profile
    const profile = await this.profileRepository.findByUserId(command.userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Update basic info
    if (command.displayName || command.bio || command.city || 
        command.country || command.website || command.instagram) {
      profile.updateProfile({
        displayName: command.displayName,
        bio: command.bio,
        city: command.city,
        country: command.country,
        website: command.website,
        instagram: command.instagram
      });
    }

    // Update avatar
    if (command.avatarUrl) {
      profile.updateAvatar(command.avatarUrl);
    }

    // Update style tags
    if (command.styleTags) {
      // Remove all existing tags
      const currentTags = profile.styleTags;
      for (const tag of currentTags) {
        profile.removeStyleTag(tag);
      }

      // Add new tags
      for (const tag of command.styleTags) {
        profile.addStyleTag(tag);
      }
    }

    // Update last active
    profile.updateLastActive();

    // Save profile
    await this.profileRepository.save(profile);

    // Publish events
    if (this.eventBus) {
      const events = profile.getUncommittedEvents();
      await this.eventBus.publishAll(events);
      profile.markEventsAsCommitted();
    }
  }
}