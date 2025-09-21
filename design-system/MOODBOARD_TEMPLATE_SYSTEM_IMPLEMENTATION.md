# Moodboard Template System Implementation

## Overview
Implemented a comprehensive solution to address moodboard saving issues and enable reusable moodboard templates for future gigs.

## Problems Solved

### 1. **Moodboard-Gig Linkage Issue**
**Problem**: Moodboards were being saved with `NULL` gig_id when using temporary gig IDs, and weren't being linked to the real gig after creation.

**Solution**: 
- Modified `handleSaveGig` in `/gigs/create/page.tsx` to update the moodboard with the real gig ID after gig creation
- Added proper error handling and logging for the linkage process

```typescript
// Update moodboard to link to the real gig ID if one exists
if (formData.moodboardId) {
  try {
    const { error: moodboardError } = await supabase
      .from('moodboards')
      .update({ gig_id: gigId })
      .eq('id', formData.moodboardId)
    
    if (moodboardError) {
      console.warn('Failed to link moodboard to gig:', moodboardError)
    } else {
      console.log('✅ Moodboard linked to gig successfully')
    }
  } catch (error) {
    console.warn('Error linking moodboard to gig:', error)
  }
}
```

### 2. **Moodboard Template System**
**Problem**: Users couldn't save moodboards as reusable templates for future gigs.

**Solution**: 
- **Database Schema**: Added template support to moodboards table
- **UI Enhancement**: Added template saving functionality to MoodboardBuilder
- **Flexible Architecture**: Supports both gig-specific and template moodboards

## Database Schema Changes

### New Migration: `008_add_moodboard_templates.sql`
```sql
-- Add template support to moodboards table
ALTER TABLE moodboards 
ADD COLUMN is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN template_name VARCHAR(255),
ADD COLUMN template_description TEXT;

-- Create index for template queries
CREATE INDEX idx_moodboards_template ON moodboards(is_template, owner_user_id);
```

### Schema Fields:
- `is_template`: Boolean flag indicating if this is a reusable template
- `template_name`: Name of the template (only used when is_template = true)
- `template_description`: Description of the template (only used when is_template = true)
- `gig_id`: NULL for templates and temporary moodboards, linked for permanent gigs

## UI Implementation

### Template Saving Interface
Added to `MoodboardBuilder.tsx`:

1. **Template Toggle Button**: 
   - "Save as Template" button with BookOpen icon
   - Visual feedback when template mode is active
   - Disabled when no items are present

2. **Template Name Input**:
   - Appears when template mode is enabled
   - Allows users to name their templates
   - Helpful description text

3. **Enhanced Save Logic**:
   - Conditionally sets template fields based on user selection
   - Excludes gig_id for templates
   - Maintains backward compatibility

### Code Changes in MoodboardBuilder.tsx:

```typescript
// New state variables
const [saveAsTemplate, setSaveAsTemplate] = useState(false)
const [templateName, setTemplateName] = useState('')

// Enhanced save logic
const moodboardData: any = {
  owner_user_id: profile.id,
  title: title || 'Untitled Moodboard',
  summary: description,
  items,
  palette,
  is_template: saveAsTemplate,
  template_name: saveAsTemplate ? (templateName || title || 'Untitled Template') : null,
  template_description: saveAsTemplate ? description : null
}

// Only include gig_id if it's a valid UUID and not saving as template
if (!saveAsTemplate && gigId && !gigId.startsWith('temp-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gigId)) {
  moodboardData.gig_id = gigId
}
```

## User Workflow

### For Gig Creation:
1. **Create Moodboard**: User creates moodboard during gig creation
2. **Save as Regular Moodboard**: Moodboard is saved with temporary gig_id (NULL)
3. **Complete Gig Creation**: When gig is saved, moodboard is automatically linked
4. **Result**: Moodboard is permanently associated with the gig

### For Template Creation:
1. **Create Moodboard**: User creates moodboard (can be during gig creation or standalone)
2. **Enable Template Mode**: Click "Save as Template" button
3. **Name Template**: Enter a descriptive template name
4. **Save Template**: Moodboard is saved as a reusable template
5. **Result**: Template can be used for future gigs

## Benefits

### ✅ **Fixes Current Issues**:
- **UUID Syntax Error**: Resolved by conditional gig_id inclusion
- **Moodboard-Gig Disconnection**: Fixed with post-creation linkage
- **"No Visual Moodboard" Message**: Eliminated through proper data flow

### ✅ **New Capabilities**:
- **Template System**: Users can save moodboards as reusable templates
- **Flexible Workflow**: Supports both gig-specific and standalone moodboards
- **Better Organization**: Templates are clearly distinguished from gig-specific moodboards

### ✅ **Technical Improvements**:
- **Database Integrity**: Only valid UUIDs are stored in gig_id field
- **Error Handling**: Comprehensive error handling and logging
- **Backward Compatibility**: Existing moodboards continue to work
- **Performance**: Indexed template queries for efficient retrieval

## Usage Examples

### Creating a Template:
1. Go to gig creation → moodboard step
2. Add images and create color palette
3. Click "Save as Template" button
4. Enter template name (e.g., "Fashion Shoot - Studio Lighting")
5. Click "Save Moodboard"
6. Template is now available for future use

### Using a Template:
1. Start new gig creation
2. In moodboard step, select "Use Template" (future enhancement)
3. Choose from saved templates
4. Customize as needed
5. Save as regular moodboard for the gig

## Future Enhancements

### Potential Improvements:
1. **Template Gallery**: UI to browse and select from saved templates
2. **Template Categories**: Organize templates by type (fashion, portrait, etc.)
3. **Template Sharing**: Allow users to share templates with others
4. **Template Analytics**: Track which templates are most popular
5. **Template Import/Export**: Allow template backup and migration

## Testing

### Verification Steps:
1. **Create Gig with Moodboard**: Verify moodboard saves without UUID errors
2. **Complete Gig Creation**: Verify moodboard gets linked to real gig ID
3. **Create Template**: Verify template saves with proper template fields
4. **Check Database**: Verify schema changes are applied correctly
5. **Error Handling**: Test with invalid data to ensure graceful failures

## Related Files
- `apps/web/app/gigs/create/page.tsx` - Gig creation and moodboard linkage
- `apps/web/app/components/MoodboardBuilder.tsx` - Template UI and save logic
- `supabase/migrations/008_add_moodboard_templates.sql` - Database schema changes
- `design-system/MOODBOARD_TEMPORARY_GIG_ID_FIX.md` - Related UUID fix documentation
