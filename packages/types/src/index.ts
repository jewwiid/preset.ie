// Re-export everything from subdirectories
export * from './api';
export * from './dto';
export * from './validation';

// Re-export cinematic parameters (excluding ColorPalette to avoid conflict with validation/ColorPalette)
export type {
  CameraAngle,
  LensType,
  ShotSize,
  DepthOfField,
  CompositionTechnique,
  LightingStyle,
  ColorPalette as CinematicColorPalette,
  DirectorStyle,
  EraEmulation,
  SceneMood,
  CameraMovement,
  AspectRatio,
  TimeSetting,
  WeatherCondition,
  LocationType,
  ForegroundElement,
  SubjectCount,
  EyeContact,
  CinematicParameters,
  PromptTemplate,
  CinematicFilter,
  CinematicEnhancementRequest,
  CinematicEnhancementResponse
} from './cinematic-parameters';
export { CINEMATIC_PARAMETERS } from './cinematic-parameters';

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