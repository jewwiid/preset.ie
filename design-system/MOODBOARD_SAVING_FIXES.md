# Moodboard Saving Issues Fixes

## 🎯 **Issues Identified**

### **1. Saving Hangs on 'Saving...' State**
- The moodboard save function was hanging indefinitely
- Users reported the "Saving..." button state never completing
- No error messages were displayed to users

### **2. "No Visual Moodboard" Message Appearing**
- After saving, the review step showed "No moodboard has been created for this gig"
- The moodboardId was not being properly passed or saved
- Database schema mismatch causing save failures

## 🔧 **Root Cause Analysis**

### **Database Schema Mismatch**
The MoodboardBuilder was trying to insert fields that don't exist in the database:
- **`tags: selectedTags`** - This field doesn't exist in the moodboards table
- **`is_public: false`** - This field was added in a later migration but not in the base schema

### **Missing Error Details**
The error handling was not providing enough detail to debug the actual database errors.

## ✅ **Fixes Applied**

### **1. Fixed Database Insert Fields**
```tsx
// Before (causing database errors)
const { data: newMoodboard, error: createError } = await supabase
  .from('moodboards')
  .insert({
    owner_user_id: profile.id,
    gig_id: gigId,
    title: title || 'Untitled Moodboard',
    summary: description,
    items,
    palette,
    tags: selectedTags,        // ❌ Field doesn't exist
    is_public: false          // ❌ Field doesn't exist in base schema
  })

// After (using correct schema)
const { data: newMoodboard, error: createError } = await supabase
  .from('moodboards')
  .insert({
    owner_user_id: profile.id,
    gig_id: gigId,
    title: title || 'Untitled Moodboard',
    summary: description,
    items,
    palette                    // ✅ Only existing fields
  })
```

### **2. Fixed Update Fields**
```tsx
// Before
.update({
  title: title || 'Untitled Moodboard',
  summary: description,
  items,
  palette,
  tags: selectedTags,          // ❌ Field doesn't exist
  updated_at: new Date().toISOString()
})

// After
.update({
  title: title || 'Untitled Moodboard',
  summary: description,
  items,
  palette,                     // ✅ Only existing fields
  updated_at: new Date().toISOString()
})
```

### **3. Enhanced Error Logging**
```tsx
// Before
} catch (err: any) {
  console.error('Save error:', err)
  setError(err.message || 'Failed to save moodboard')
}

// After
} catch (err: any) {
  console.error('Save error:', err)
  console.error('Error details:', {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint
  })
  setError(err.message || 'Failed to save moodboard')
}
```

## 📋 **Database Schema Reference**

### **Moodboards Table (Base Schema)**
```sql
CREATE TABLE moodboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    title VARCHAR(255),
    summary TEXT,
    palette JSONB,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Available Fields**
- ✅ `id` - Auto-generated UUID
- ✅ `gig_id` - Reference to gig
- ✅ `owner_user_id` - Reference to user profile
- ✅ `title` - Moodboard title
- ✅ `summary` - Description/summary
- ✅ `palette` - JSONB color palette
- ✅ `items` - JSONB array of moodboard items
- ✅ `created_at` - Timestamp
- ✅ `updated_at` - Timestamp

### **Fields Added in Later Migrations**
- `is_public` - Added in 007_complete_moodboard_schema.sql
- `source_breakdown` - Added in 007_complete_moodboard_schema.sql
- `enhancement_log` - Added in 007_complete_moodboard_schema.sql
- `total_cost` - Added in 007_complete_moodboard_schema.sql
- `generated_prompts` - Added in 007_complete_moodboard_schema.sql
- `ai_provider` - Added in 007_complete_moodboard_schema.sql

## 🎯 **Expected Behavior After Fix**

### **1. Save Process**
1. User adds images to moodboard
2. Clicks "Save Moodboard" button
3. Button shows "Saving..." state
4. Database insert/update completes successfully
5. `onSave(newMoodboard.id)` callback is triggered
6. Button returns to normal state
7. User can proceed to next step

### **2. Review Step**
1. MoodboardId is properly passed to ReviewPublishStep
2. Moodboard data is fetched and displayed
3. "No Visual Moodboard" message only shows when truly no moodboard exists
4. Color palette and images are displayed correctly

## 📁 **Files Modified**
- `apps/web/app/components/MoodboardBuilder.tsx`
  - Fixed database insert fields to match schema
  - Fixed database update fields to match schema
  - Enhanced error logging for better debugging

## 🔍 **Testing**
After these fixes, the moodboard should:
- ✅ Save successfully without hanging
- ✅ Display proper error messages if issues occur
- ✅ Pass moodboardId correctly to review step
- ✅ Show moodboard data in review step
- ✅ Handle both create and update scenarios

## 📝 **Notes**
- The `tags` functionality was removed temporarily to fix the immediate issue
- If tags are needed in the future, the database schema should be updated first
- The enhanced error logging will help debug any future database issues
- All existing moodboard functionality is preserved except for the tags field
