// Profile Components - Main Export File
// This file provides easy access to all refactored profile components

// Context
export { ProfileProvider, useProfileContext } from './context/ProfileContext'
export { 
  useProfile, 
  useProfileSettings, 
  useProfileEditing, 
  useProfileForm, 
  useProfileUI 
} from './context/ProfileContext'

// Layout Components
export { ProfileLayout } from './layout/ProfileLayout'
export { ProfileHeaderEnhanced } from './layout/ProfileHeaderEnhanced'
export { ProfileTabs, ProfileSubTabs } from './layout/ProfileTabs'

// Section Components
export { ProfileContent } from './sections/ProfileContent'
export { PersonalInfoSection } from './sections/PersonalInfoSection'
export { StyleSection } from './sections/StyleSection'
export { ProfessionalSection } from './sections/ProfessionalSection'
export { TalentSpecificSection } from './sections/TalentSpecificSection'
export { SettingsPanel } from './sections/SettingsPanel'

// Common Components
export { 
  FormField, 
  TextField, 
  TextareaField, 
  NumberField, 
  RangeField, 
  EmailField, 
  UrlField, 
  DateField 
} from './common/FormField'

export { 
  TagInput, 
  StyleTagInput, 
  VibeTagInput, 
  SpecializationTagInput, 
  EquipmentTagInput 
} from './common/TagInput'

export { 
  ToggleSwitch, 
  LocationToggle, 
  TravelToggle, 
  StudioToggle, 
  TattoosToggle, 
  PiercingsToggle 
} from './common/ToggleSwitch'

export { 
  MediaUpload, 
  AvatarUpload, 
  BannerUpload 
} from './common/MediaUpload'

export { 
  ValidationMessage, 
  SuccessMessage, 
  ErrorMessage, 
  WarningMessage, 
  InfoMessage 
} from './common/ValidationMessage'

// Custom Hooks
export { useProfileData } from './hooks/useProfileData'
export { useMediaUpload } from './hooks/useMediaUpload'
export { useValidation } from './hooks/useValidation'

// Types
export type {
  UserProfile,
  UserSettings,
  NotificationPreferences,
  BannerPosition,
  PurposeType,
  EquipmentType,
  EquipmentBrand,
  EquipmentModel,
  PredefinedOption,
  ValidationResult,
  ValidationType,
  ProfileState,
  ProfileAction,
  FormFieldProps,
  TagInputProps,
  ToggleSwitchProps,
  MediaUploadProps,
  ValidationMessageProps,
  UseProfileDataReturn,
  UseProfileFormReturn,
  UseMediaUploadReturn,
  UseValidationReturn
} from './types/profile'

// Constants
export { 
  PURPOSE_LABELS, 
  FALLBACK_VIBES, 
  FALLBACK_STYLES 
} from './types/profile'
