// Shared
export * from './shared/entity';
export * from './shared/DomainEvent';
export * from './shared/DomainError';
export * from './shared/BaseAggregateRoot';
export * from './shared/value-objects/entity-id';
export * from './shared/ports/EventBus';
export * from './shared/IdGenerator';

// Identity
export * from './identity/entities/User';
export * from './identity/entities/Profile';
export * from './identity/ports/UserRepository';
export * from './identity/ports/ProfileRepository';
export * from './identity/value-objects/Email';
export * from './identity/value-objects/Handle';
export * from './identity/value-objects/UserRole';
export * from './identity/value-objects/VerificationStatus';

// Gigs
export * from './gigs/entities/gig';
export * from './gigs/ports/GigRepository';
export * from './gigs/value-objects/compensation-type';
export * from './gigs/value-objects/location';
export * from './gigs/value-objects/gig-status';
export * from './gigs/events/gig-events';

// Applications
export * from './applications/entities/application';
export * from './applications/ports/ApplicationRepository';
export * from './applications/value-objects/application-status';
export * from './applications/events/ApplicationEvents';

// Collaboration
export * from './collaboration/entities/Conversation';
export * from './collaboration/entities/Message';
export * from './collaboration/entities/UserBlock';
export * from './collaboration/ports/ConversationRepository';
export * from './collaboration/ports/UserBlockRepository';
export * from './collaboration/value-objects/Attachment';
export * from './collaboration/value-objects/BlockReason';
export * from './collaboration/value-objects/ConversationStatus';
export * from './collaboration/value-objects/MessageBody';
export * from './collaboration/events/UserBlockEvents';

// Moodboards
export * from './moodboards/entities/Moodboard';
export * from './moodboards/entities/MoodboardItem';
export * from './moodboards/ports/MoodboardRepository';
export * from './moodboards/ports/ImageStorageService';
export * from './moodboards/ports/AIImageService';
export * from './moodboards/ports/StockPhotoService';
export * from './moodboards/events/MoodboardEvents';

// Showcases
export * from './showcases/entities/showcase';
export * from './showcases/entities/Review';
export * from './showcases/value-objects/Approval';
export * from './showcases/value-objects/ReviewTag';
export * from './showcases/value-objects/Visibility';

// Subscriptions
export * from './subscriptions/SubscriptionTier';
export * from './subscriptions/SubscriptionPolicy';
export * from './subscriptions/SubscriptionLimitExceeded';

// Credits
export * from './credits/CreditScalingService';