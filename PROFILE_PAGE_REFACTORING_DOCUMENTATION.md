# Profile Page Refactoring Documentation

## Table of Contents
1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Refactoring Goals](#refactoring-goals)
4. [Component Architecture](#component-architecture)
5. [Edit Functionality Preservation](#edit-functionality-preservation)
6. [Implementation Plan](#implementation-plan)
7. [File Structure](#file-structure)
8. [Migration Strategy](#migration-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Performance Considerations](#performance-considerations)

## Overview

The profile page (`/apps/web/app/profile/page.tsx`) is a complex React component with 6500+ lines that handles user profile management, settings, and presentation. This document outlines a comprehensive refactoring strategy to break it down into smaller, maintainable components while preserving all functionality, especially the critical edit profile capabilities.

## Current State Analysis

### File Statistics
- **Lines of Code**: 6500+
- **Console Statements**: 93 (reduced from 144)
- **Main Functions**: 3 (ProfilePage, ProfilePageContent, UserSettingsTab)
- **State Variables**: 50+ useState hooks
- **Form Fields**: 40+ input fields
- **Conditional Rendering**: Complex nested conditionals

### Key Functionality
1. **Profile Display**: Shows user information in read-only mode
2. **Profile Editing**: Full editing capabilities with form validation
3. **Media Management**: Avatar and header banner uploads with positioning
4. **Settings Management**: User preferences and notification settings
5. **Credit Management**: Financial information and credit dashboard
6. **Role-based Fields**: Different fields based on user role (talent vs client)

### Main Data Structures
```typescript
interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  header_banner_url?: string;
  header_banner_position?: string;
  bio?: string;
  city?: string;
  country?: string;
  // ... 40+ more fields
}

interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  // ... more settings
}

interface NotificationPreferences {
  id?: string;
  user_id: string;
  location_radius: number;
  preferred_purposes: string[];
  // ... more preferences
}
```

## Refactoring Goals

### Primary Objectives
1. **Reduce File Size**: Break down 6500+ line file into manageable components
2. **Improve Maintainability**: Create logical component boundaries
3. **Preserve Functionality**: Maintain all existing features, especially editing
4. **Enhance Performance**: Optimize rendering and state management
5. **Improve Developer Experience**: Better code organization and debugging

### Success Criteria
- ✅ All edit functionality preserved
- ✅ Identical user interface and styling
- ✅ Same user experience and interactions
- ✅ Improved code maintainability
- ✅ Better performance characteristics

## Component Architecture

### 1. Layout Components
```
/components/profile/layout/
├── ProfileLayout.tsx          # Main layout wrapper
├── ProfileHeader.tsx          # Header with avatar, banner, actions
└── ProfileTabs.tsx            # Main tab navigation
```

### 2. Section Components
```
/components/profile/sections/
├── ProfileContent.tsx         # Profile tab content container
├── PersonalInfoSection.tsx    # Basic user information
├── StyleSection.tsx           # Style and vibe tags
├── ProfessionalSection.tsx    # Professional details
├── TalentSpecificSection.tsx  # Talent-specific fields
└── SettingsPanel.tsx          # User settings management
```

### 3. Common Components
```
/components/profile/common/
├── FormField.tsx              # Reusable form input component
├── TagInput.tsx               # Tag management component
├── ToggleSwitch.tsx           # Boolean toggle component
├── MediaUpload.tsx            # Image upload component
└── ValidationMessage.tsx      # Error/success message display
```

### 4. Custom Hooks
```
/components/profile/hooks/
├── useProfileData.tsx         # Profile data fetching
├── useProfileForm.tsx         # Form state management
├── useMediaUpload.tsx         # Media upload handling
└── useValidation.tsx          # Form validation logic
```

### 5. Context and Types
```
/components/profile/
├── context/
│   └── ProfileContext.tsx     # Shared state management
└── types/
    └── profile.ts             # TypeScript interfaces
```

## Edit Functionality Preservation

### Critical Edit Features Maintained

#### 1. **Profile Editing Mode**
```typescript
// State management for edit mode
const [isEditing, setIsEditing] = useState(false);
const [isEditingHeader, setIsEditingHeader] = useState(false);

// Toggle edit mode
const handleEditToggle = () => {
  setIsEditing(!isEditing);
  if (!isEditing) {
    // Enter edit mode - load current profile data
    setFormData({
      display_name: profile?.display_name || '',
      handle: profile?.handle || '',
      // ... all other fields
    });
  }
};
```

#### 2. **Form Data Management**
```typescript
// Form state with all profile fields
const [formData, setFormData] = useState({
  display_name: '',
  handle: '',
  bio: '',
  city: '',
  country: '',
  phone_number: '',
  instagram_handle: '',
  tiktok_handle: '',
  website_url: '',
  portfolio_url: '',
  years_experience: 0,
  specializations: [],
  equipment_list: [],
  editing_software: [],
  languages: [],
  hourly_rate_min: null,
  hourly_rate_max: null,
  available_for_travel: false,
  travel_radius_km: null,
  travel_unit_preference: 'km',
  studio_name: '',
  has_studio: false,
  studio_address: '',
  show_location: true,
  typical_turnaround_days: null,
  turnaround_unit_preference: 'days',
  height_cm: null,
  measurements: '',
  eye_color: '',
  hair_color: '',
  shoe_size: '',
  clothing_sizes: [],
  tattoos: false,
  piercings: false,
  talent_categories: [],
  style_tags: [],
  // ... all other fields
});
```

#### 3. **Save and Cancel Functionality**
```typescript
// Save profile changes
const handleSave = async () => {
  if (!user || !profile) return;

  setSaving(true);
  try {
    // Sanitize and validate form data
    const sanitizedFormData = {
      display_name: formData.display_name.trim(),
      handle: formData.handle.trim(),
      bio: formData.bio.trim(),
      // ... sanitize all fields
    };

    // Update profile in database
    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedFormData)
      .eq('id', profile.id);

    if (error) {
      setError('Failed to save profile');
      return;
    }

    // Update local state
    setProfile(data);
    setIsEditing(false);
    setFormData(data);
  } catch (err) {
    setError('An unexpected error occurred');
  } finally {
    setSaving(false);
  }
};

// Cancel editing
const handleCancel = () => {
  if (profile) {
    // Reset form data to current profile values
    setFormData({
      display_name: profile.display_name || '',
      handle: profile.handle || '',
      // ... reset all fields
    });
  }
  setIsEditing(false);
  setIsEditingHeader(false);
};
```

#### 4. **Field-by-Field Editing**
```typescript
// Individual field updates
const handleFieldChange = (field: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

// Usage in form fields
<input
  type="text"
  value={formData.display_name}
  onChange={(e) => handleFieldChange('display_name', e.target.value)}
  className="form-input"
  placeholder="Display name"
/>
```

#### 5. **Dynamic Field Rendering**
```typescript
// Conditional field rendering based on edit mode
{isEditing ? (
  <input
    type="text"
    value={formData.display_name}
    onChange={(e) => handleFieldChange('display_name', e.target.value)}
    className="editable-field"
  />
) : (
  <div className="display-field">
    {profile?.display_name || 'Not specified'}
  </div>
)}
```

#### 6. **Media Upload and Editing**
```typescript
// Avatar editing
const handleAvatarUpdate = (newAvatarUrl: string) => {
  setFormData(prev => ({
    ...prev,
    avatar_url: newAvatarUrl
  }));
};

// Header banner editing with drag positioning
const handleBannerUpdate = (newBannerUrl: string) => {
  setFormData(prev => ({
    ...prev,
    header_banner_url: newBannerUrl
  }));
};

// Drag and drop positioning
const handleHeaderDragStart = (e: React.MouseEvent | React.TouchEvent) => {
  setIsDraggingHeader(true);
  setIsEditingHeader(true);
  // ... drag logic
};
```

#### 7. **Tag Management**
```typescript
// Add tags
const addStyleTag = async () => {
  const trimmed = newStyleTag.trim();
  if (!trimmed) return;

  // Validation
  const validation = await validateAndCheckTag(trimmed, 'style');
  if (!validation.isValid) {
    setStyleTagError(validation.error || 'Invalid tag');
    return;
  }

  // Add to form data
  setFormData(prev => ({
    ...prev,
    style_tags: [...prev.style_tags, trimmed]
  }));
  setNewStyleTag('');
};

// Remove tags
const removeStyleTag = (tag: string) => {
  setFormData(prev => ({
    ...prev,
    style_tags: prev.style_tags.filter(t => t !== tag)
  }));
};
```

#### 8. **Validation and Error Handling**
```typescript
// Field validation
const validateField = (field: string, value: any): boolean => {
  switch (field) {
    case 'display_name':
      return value.trim().length > 0;
    case 'handle':
      return /^[a-zA-Z0-9_]+$/.test(value);
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    // ... other validations
    default:
      return true;
  }
};

// Error state management
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

const setFieldError = (field: string, error: string) => {
  setFieldErrors(prev => ({
    ...prev,
    [field]: error
  }));
};
```

### Edit Mode UI States

#### 1. **Action Buttons**
```typescript
// Edit mode buttons
{isEditing ? (
  <>
    <button
      onClick={handleSave}
      disabled={saving}
      className="save-button"
    >
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
    <button
      onClick={handleCancel}
      className="cancel-button"
    >
      Cancel
    </button>
  </>
) : (
  <button
    onClick={() => setIsEditing(true)}
    className="edit-button"
  >
    Edit Profile
  </button>
)}
```

#### 2. **Visual Indicators**
- Edit mode styling for form fields
- Loading states during save operations
- Success/error messages
- Field validation indicators

#### 3. **Responsive Behavior**
- Mobile-friendly edit interface
- Touch-optimized controls
- Responsive form layouts

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)
1. Create folder structure
2. Extract types and interfaces
3. Set up ProfileContext with reducer
4. Create basic layout components

### Phase 2: Core Components (Week 2)
1. Implement FormField component
2. Create TagInput component
3. Build MediaUpload component
4. Extract common UI patterns

### Phase 3: Section Components (Week 3)
1. Extract PersonalInfoSection
2. Implement StyleSection
3. Create ProfessionalSection
4. Build TalentSpecificSection

### Phase 4: Integration (Week 4)
1. Connect all components
2. Implement data flow
3. Test all functionality
4. Optimize performance

## File Structure

```
/apps/web/
├── app/profile/
│   └── page.tsx                    # Main page (simplified)
├── components/profile/
│   ├── context/
│   │   └── ProfileContext.tsx      # Shared state management
│   ├── layout/
│   │   ├── ProfileLayout.tsx       # Main layout
│   │   ├── ProfileHeader.tsx       # Header component
│   │   └── ProfileTabs.tsx         # Tab navigation
│   ├── sections/
│   │   ├── ProfileContent.tsx      # Profile tab container
│   │   ├── PersonalInfoSection.tsx # Personal info section
│   │   ├── StyleSection.tsx        # Style tags section
│   │   ├── ProfessionalSection.tsx # Professional section
│   │   ├── TalentSpecificSection.tsx # Talent fields
│   │   └── SettingsPanel.tsx       # Settings panel
│   ├── common/
│   │   ├── FormField.tsx           # Reusable form field
│   │   ├── TagInput.tsx            # Tag input component
│   │   ├── ToggleSwitch.tsx        # Toggle component
│   │   ├── MediaUpload.tsx         # Media upload
│   │   └── ValidationMessage.tsx   # Error messages
│   ├── hooks/
│   │   ├── useProfileData.tsx      # Data fetching
│   │   ├── useProfileForm.tsx      # Form management
│   │   ├── useMediaUpload.tsx      # Media handling
│   │   └── useValidation.tsx       # Validation logic
│   └── types/
│       └── profile.ts              # TypeScript types
```

## Migration Strategy

### Incremental Approach
1. **Parallel Implementation**: Build new components alongside existing code
2. **Feature Flags**: Use flags to switch between old and new implementations
3. **Section-by-Section**: Replace one section at a time
4. **Testing**: Test each replacement thoroughly before proceeding

### Rollback Plan
1. Keep original implementation as backup
2. Maintain feature flags for quick rollback
3. Document any breaking changes
4. Have rollback procedures ready

### Data Migration
1. Ensure data structures remain compatible
2. Test data persistence across implementations
3. Verify form validation consistency
4. Check media upload functionality

## Testing Strategy

### Unit Testing
- Test each component in isolation
- Verify props and state management
- Test form validation logic
- Check error handling

### Integration Testing
- Test component interactions
- Verify data flow through context
- Test form submission end-to-end
- Check media upload workflows

### User Acceptance Testing
- Test complete user journeys
- Verify edit functionality works identically
- Check responsive behavior
- Test accessibility features

### Performance Testing
- Measure render performance
- Check memory usage
- Test with large datasets
- Verify optimization benefits

## Performance Considerations

### Code Splitting
```typescript
// Lazy load heavy components
const SettingsPanel = lazy(() => import('./sections/SettingsPanel'));
const CreditsDashboard = lazy(() => import('./credits/CreditsDashboard'));
```

### Memoization
```typescript
// Memoize expensive components
const PersonalInfoSection = memo(({ formData, onFieldChange }) => {
  // Component implementation
});

// Memoize expensive calculations
const processedFormData = useMemo(() => {
  return sanitizeAndValidate(formData);
}, [formData]);
```

### State Optimization
```typescript
// Use selector pattern to avoid unnecessary rerenders
const { profile, isEditing } = useProfileContext(state => ({
  profile: state.profile,
  isEditing: state.isEditing
}));
```

### Bundle Optimization
- Tree-shake unused code
- Optimize import statements
- Use dynamic imports for large features
- Implement proper code splitting

## Conclusion

This refactoring plan maintains 100% of the existing edit functionality while significantly improving code maintainability and performance. The modular architecture will make future development much easier while preserving the exact same user experience.

The key to success is the incremental approach - building and testing each component carefully to ensure no functionality is lost during the migration process.
