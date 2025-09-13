import { EventHandlerRegistry } from './EventHandler';
import { EventProcessor } from './EventProcessor';

// Import all handlers
import { UserRegisteredHandler } from '../identity/event-handlers/UserRegisteredHandler';
import { ApplicationSubmittedHandler } from '../applications/event-handlers/ApplicationSubmittedHandler';
import { TalentBookedHandler } from '../applications/event-handlers/TalentBookedHandler';
import { ShowcasePublishedHandler } from '../showcases/event-handlers/ShowcasePublishedHandler';

// Import repositories and services
import { ProfileRepository, UserRepository, GigRepository, ConversationRepository, IdGenerator, DomainEvent } from '@preset/domain';

export interface EventHandlerDependencies {
  // Repositories
  profileRepository: ProfileRepository;
  userRepository: UserRepository;
  gigRepository: GigRepository;
  conversationRepository: ConversationRepository;
  
  // Services
  idGenerator: IdGenerator;
  emailService?: {
    sendWelcomeEmail(email: string, role: string): Promise<void>;
  };
  notificationService?: {
    sendApplicationNotification(ownerId: string, gigTitle: string, applicantName: string): Promise<void>;
    sendBookingConfirmation(talentEmail: string, ownerEmail: string, gigTitle: string, gigDate: Date): Promise<void>;
    sendShowcasePublishedNotification(creatorEmail: string, talentEmail: string, showcaseUrl: string): Promise<void>;
  };
  
  // Event persistence
  persistEvent?: (event: DomainEvent) => Promise<void>;
}

/**
 * Configure and wire up all event handlers
 */
export function configureEventHandlers(deps: EventHandlerDependencies): EventProcessor {
  const registry = new EventHandlerRegistry();

  // Register Identity handlers
  registry.register(new UserRegisteredHandler(
    deps.profileRepository,
    deps.emailService
  ));

  // Register Application handlers
  registry.register(new ApplicationSubmittedHandler(
    deps.gigRepository,
    deps.userRepository,
    deps.notificationService
  ));

  registry.register(new TalentBookedHandler(
    deps.gigRepository,
    deps.userRepository,
    deps.conversationRepository,
    deps.notificationService
  ));

  // Register Showcase handlers
  registry.register(new ShowcasePublishedHandler(
    deps.profileRepository,
    deps.userRepository,
    deps.notificationService
  ));

  // Create and return the event processor
  return new EventProcessor(registry, deps.persistEvent);
}

/**
 * Create a mock event processor for testing
 */
export function createMockEventProcessor(): EventProcessor {
  const registry = new EventHandlerRegistry();
  return new EventProcessor(registry);
}