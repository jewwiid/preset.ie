# Edit Tab Refactoring Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the Edit Tab refactoring to bring it up to the same level of sophistication as the Stitch tab.

## Implementation Steps

### Step 1: Database Setup

#### 1.1 Run the Migration
```bash
# Run the edit types migration
supabase db push --file supabase/migrations/20250131_create_edit_types_system.sql
```

#### 1.2 Verify Database Tables
- `edit_types` - Contains all edit types with metadata
- `edit_type_categories` - Categories for organizing edit types
- `edit_presets` - Predefined edit combinations

### Step 2: API Endpoints

#### 2.1 Edit Types API (`/api/edit/types`)
- **GET**: Returns all active edit types with categories
- **POST**: Creates new edit types (admin only)

#### 2.2 Edit Presets API (`/api/edit/presets`)
- **GET**: Returns all active edit presets
- **POST**: Creates new edit presets (admin only)

### Step 3: New Components

#### 3.1 EditTypeSelector Component
- **Location**: `apps/web/app/components/playground/edit/EditTypeSelector.tsx`
- **Purpose**: Database-driven edit type selection
- **Features**:
  - Fetches edit types from API
  - Displays categories and credit costs
  - Shows descriptions and requirements

#### 3.2 EditPresetSelector Component
- **Location**: `apps/web/app/components/playground/edit/EditPresetSelector.tsx`
- **Purpose**: Quick-start templates for common edits
- **Features**:
  - Predefined edit combinations
  - One-click application
  - Credit cost display

#### 3.3 EditControlPanel Component
- **Location**: `apps/web/app/components/playground/edit/EditControlPanel.tsx`
- **Purpose**: Main control panel using Stitch patterns
- **Features**:
  - Collapsible preset section
  - Mention system integration
  - Database-driven edit types
  - Consistent styling with Stitch

### Step 4: Refactored AdvancedEditingPanel

#### 4.1 New Implementation
- **Location**: `apps/web/app/components/playground/AdvancedEditingPanelRefactored.tsx`
- **Purpose**: Updated panel using new components
- **Features**:
  - Reuses existing image import logic
  - Integrates new EditControlPanel
  - Maintains all existing functionality

### Step 5: Integration

#### 5.1 Update EditTab
```typescript
// In EditTab.tsx, replace AdvancedEditingPanel with AdvancedEditingPanelRefactored
import AdvancedEditingPanelRefactored from '../AdvancedEditingPanelRefactored'

// Update the component usage
<AdvancedEditingPanelRefactored
  onEdit={onEdit}
  loading={loading}
  selectedImage={selectedImage}
  savedImages={savedImages}
  onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
  onImageUpload={async (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }}
/>
```

## Benefits of the Refactoring

### 1. Consistency with Stitch Tab
- **Same UI patterns**: Collapsible sections, preset system
- **Unified design language**: Consistent styling and layout
- **Reusable components**: Shared patterns across tabs

### 2. Database-Driven Approach
- **No more hardcoded types**: All edit types stored in database
- **Easy extensibility**: Add new edit types without code changes
- **Admin management**: Manage types through database

### 3. Enhanced User Experience
- **Mention system**: Reference images with @ syntax
- **Preset system**: Quick-start templates for common edits
- **Better organization**: Categorized edit types

### 4. Improved Maintainability
- **Centralized logic**: Edit types managed in one place
- **Reusable components**: Shared across different parts of the app
- **Type safety**: Better TypeScript integration

## Migration Strategy

### Phase 1: Backward Compatibility
1. Keep existing `AdvancedEditingPanel.tsx` as fallback
2. Create new refactored version alongside
3. Test thoroughly before switching

### Phase 2: Gradual Migration
1. Update `EditTab.tsx` to use refactored version
2. Monitor for any issues
3. Keep old version as backup

### Phase 3: Cleanup
1. Remove old hardcoded functions
2. Clean up unused imports
3. Update documentation

## Testing Checklist

### Database
- [ ] Edit types migration runs successfully
- [ ] All 17 edit types are created
- [ ] Categories are properly set up
- [ ] Presets are created

### API Endpoints
- [ ] `/api/edit/types` returns correct data
- [ ] `/api/edit/presets` returns correct data
- [ ] Error handling works properly

### Components
- [ ] EditTypeSelector loads and displays types
- [ ] EditPresetSelector loads and displays presets
- [ ] EditControlPanel integrates properly
- [ ] Mention system works with source images

### Integration
- [ ] AdvancedEditingPanelRefactored works in EditTab
- [ ] All existing functionality preserved
- [ ] New features work correctly
- [ ] No breaking changes

## File Structure After Implementation

```
apps/web/app/components/playground/
├── edit/
│   ├── EditTypeSelector.tsx
│   ├── EditPresetSelector.tsx
│   └── EditControlPanel.tsx
├── AdvancedEditingPanel.tsx (original - keep as backup)
├── AdvancedEditingPanelRefactored.tsx (new implementation)
└── tabs/
    └── EditTab.tsx (updated to use refactored version)

apps/web/app/api/edit/
├── types/
│   └── route.ts
└── presets/
    └── route.ts

supabase/migrations/
└── 20250131_create_edit_types_system.sql
```

## Next Steps

1. **Run the migration** to create database tables
2. **Test the API endpoints** to ensure they work
3. **Update EditTab** to use the refactored version
4. **Test thoroughly** to ensure no functionality is lost
5. **Monitor for issues** and fix any problems
6. **Clean up** old code once everything is working

This refactoring brings the Edit tab up to the same level of sophistication as the Stitch tab while maintaining all existing functionality and adding powerful new features.
