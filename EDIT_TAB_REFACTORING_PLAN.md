# Edit Tab Refactoring Plan

## Current Issues with Edit Tab

### 1. Hardcoded Edit Types
- **17 hardcoded edit types** with fixed credit costs
- **Hardcoded descriptions and placeholders** for each type
- **No database-driven approach** like Stitch types
- **No extensibility** for adding new edit types

### 2. Duplicate UI Components
- **Separate image import logic** instead of reusing Stitch components
- **Custom Pexels integration** instead of using unified import dialog
- **Hardcoded reference image requirements** instead of database-driven

### 3. Inconsistent Design Patterns
- **Different styling** from Stitch tab
- **No mention system** for referencing images
- **No preset system** like Stitch has
- **No comprehensive type management**

## Proposed Refactoring

### Phase 1: Database Schema for Edit Types

#### Create `edit_types` Table
```sql
CREATE TABLE edit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_key TEXT UNIQUE NOT NULL, -- 'enhance', 'inpaint', etc.
    display_name TEXT NOT NULL,    -- 'Enhance', 'Inpaint', etc.
    description TEXT NOT NULL,
    category TEXT NOT NULL,        -- 'basic', 'advanced', 'ai_powered'
    credit_cost INTEGER NOT NULL,
    requires_reference_image BOOLEAN DEFAULT false,
    prompt_placeholder TEXT,
    icon_emoji TEXT,              -- '✨', '🎨', etc.
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Create `edit_type_categories` Table
```sql
CREATE TABLE edit_type_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key TEXT UNIQUE NOT NULL, -- 'basic', 'advanced', 'ai_powered'
    display_name TEXT NOT NULL,        -- 'Basic Edits', 'Advanced Edits', 'AI-Powered'
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Phase 2: API Endpoints

#### `/api/edit/types` - Get all edit types
```typescript
export async function GET() {
  // Return categorized edit types with metadata
  // Include credit costs, descriptions, requirements
}
```

#### `/api/edit/presets` - Edit presets (similar to Stitch)
```typescript
export async function GET() {
  // Return predefined edit presets
  // Include common edit combinations
}
```

### Phase 3: Reusable Components

#### `EditTypeSelector` Component
- **Database-driven** edit type selection
- **Categorized display** (Basic, Advanced, AI-Powered)
- **Credit cost display** from database
- **Icon and description** from database

#### `EditControlPanel` Component
- **Reuse Stitch's control panel patterns**
- **Mention system** for referencing images
- **Preset system** for common edits
- **Unified image import** using existing components

#### `EditPresetSelector` Component
- **Similar to StitchPresetSelector**
- **Predefined edit combinations**
- **Quick apply functionality**

### Phase 4: Enhanced Features

#### 1. Mention System Integration
- **@ references** to source images
- **Auto-complete** for image selection
- **Visual feedback** for referenced images

#### 2. Preset System
- **Common edit combinations**
- **User-created presets**
- **Preset sharing** (future)

#### 3. Advanced UI Features
- **Collapsible sections** like Stitch
- **Responsive design** improvements
- **Consistent styling** with Stitch tab

## Implementation Steps

### Step 1: Database Migration
1. Create `edit_types` table with all current edit types
2. Create `edit_type_categories` table
3. Populate with existing 17 edit types
4. Add RLS policies

### Step 2: API Development
1. Create `/api/edit/types` endpoint
2. Create `/api/edit/presets` endpoint
3. Update existing edit API to use database types

### Step 3: Component Refactoring
1. Create `EditTypeSelector` component
2. Create `EditControlPanel` component
3. Create `EditPresetSelector` component
4. Refactor `AdvancedEditingPanel` to use new components

### Step 4: Integration
1. Update `EditTab` to use new components
2. Integrate mention system
3. Add preset functionality
4. Test all existing functionality

## Benefits of Refactoring

### 1. Consistency
- **Same patterns** as Stitch tab
- **Unified design language**
- **Consistent user experience**

### 2. Maintainability
- **Database-driven** instead of hardcoded
- **Reusable components**
- **Centralized type management**

### 3. Extensibility
- **Easy to add new edit types**
- **User-created presets**
- **Admin management interface**

### 4. User Experience
- **Mention system** for better image referencing
- **Preset system** for common edits
- **Better organization** with categories

## Migration Strategy

### Phase 1: Backward Compatibility
- Keep existing hardcoded functions as fallback
- Gradually migrate to database-driven approach
- Ensure no breaking changes

### Phase 2: Feature Parity
- Implement all existing functionality
- Add new features (mentions, presets)
- Maintain same user experience

### Phase 3: Enhancement
- Add advanced features
- Improve UI/UX
- Add admin management

## File Structure After Refactoring

```
apps/web/app/components/playground/
├── edit/
│   ├── EditTypeSelector.tsx
│   ├── EditControlPanel.tsx
│   ├── EditPresetSelector.tsx
│   └── EditImageManager.tsx
├── shared/
│   ├── ImageImportDialog.tsx (existing)
│   ├── MentionInput.tsx (existing)
│   └── PresetSelector.tsx (existing)
└── AdvancedEditingPanel.tsx (refactored)
```

## Database Schema Details

### Edit Types Data
```sql
INSERT INTO edit_types (type_key, display_name, description, category, credit_cost, requires_reference_image, prompt_placeholder, icon_emoji) VALUES
('enhance', 'Enhance', 'Improve overall image quality, sharpness, and contrast', 'basic', 2, false, 'Describe how to enhance the image (sharpness, contrast, quality)...', '✨'),
('inpaint', 'Inpaint', 'Add or remove specific elements within the image', 'advanced', 3, false, 'Describe what you want to add or remove in specific areas...', '🎨'),
('outpaint', 'Outpaint', 'Extend the image beyond its current boundaries', 'advanced', 3, false, 'Describe how to extend the image beyond current boundaries...', '🖼️'),
('style_transfer', 'Style Transfer', 'Apply artistic styles like paintings or illustrations', 'ai_powered', 2, true, 'Choose a style (Baroque, Cyberpunk, Anime, Oil Painting, etc.)...', '🎭'),
('face_swap', 'Face Swap', 'Replace faces while maintaining natural proportions', 'ai_powered', 4, true, 'Describe the target face characteristics...', '👤'),
-- ... continue for all 17 types
```

This refactoring will bring the Edit tab up to the same level of sophistication as the Stitch tab while maintaining all existing functionality and adding powerful new features.
