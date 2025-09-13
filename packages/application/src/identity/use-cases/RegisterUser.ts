import { User, Profile, UserRepository, ProfileRepository, UserRole, Handle, EventBus } from '@preset/domain';

export interface RegisterUserCommand {
  email: string;
  role: UserRole;
  displayName: string;
  handle?: string;
}

export interface RegisterUserResult {
  userId: string;
  profileId: string;
  handle: string;
}

/**
 * Use case for registering a new user
 */
export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private profileRepository: ProfileRepository,
    private eventBus?: EventBus
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(command.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Generate or validate handle
    let handle = command.handle;
    if (!handle) {
      // Generate handle from email
      handle = Handle.generateFromEmail(command.email);
      
      // Ensure uniqueness by adding random suffix if needed
      let attempts = 0;
      while (await this.profileRepository.handleExists(handle) && attempts < 10) {
        handle = Handle.generateFromEmail(command.email) + Math.random().toString(36).substr(2, 3);
        attempts++;
      }
    } else {
      // Validate provided handle
      if (!Handle.isValid(handle)) {
        throw new Error('Invalid handle format');
      }
      
      // Check if handle is taken
      if (await this.profileRepository.handleExists(handle)) {
        throw new Error('Handle already taken');
      }
    }

    // Create user
    const user = User.create({
      email: command.email,
      role: command.role
    });

    // Create profile
    const profile = Profile.create({
      userId: user.id,
      handle,
      displayName: command.displayName
    });

    // Save user and profile
    await this.userRepository.save(user);
    await this.profileRepository.save(profile);

    // Publish domain events
    if (this.eventBus) {
      const userEvents = user.getUncommittedEvents();
      const profileEvents = profile.getUncommittedEvents();
      
      await this.eventBus.publishAll([...userEvents, ...profileEvents]);
      
      user.markEventsAsCommitted();
      profile.markEventsAsCommitted();
    }

    return {
      userId: user.id,
      profileId: profile.id,
      handle: profile.handle.toString()
    };
  }
}