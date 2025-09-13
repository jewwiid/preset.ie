// Re-export everything from subdirectories
export * from './api';
export * from './dto';
export * from './validation';

// Re-export database types with aliases to avoid conflicts
export * from './database';
export { NotificationType as DatabaseNotificationType } from './database';

// Selective re-export from notifications to avoid conflicts
export {
  type NotificationCategory,
  type DigestFrequency,
  type NotificationAction,
  type NotificationPreferences,
  type NotificationFilters,
  type NotificationRepository,
  type NotificationPreferencesRepository,
  type NotificationPayload,
  type NotificationService,
  type Notification
} from './notifications';