# Media Type Case Migration

## Problem
The database was storing `media_type` values as uppercase (`'IMAGE'`, `'VIDEO'`, `'PDF'`) but the frontend expected lowercase values (`'image'`, `'video'`, `'pdf'`). This caused issues where saved images wouldn't appear in the Stitch import dialog and other components.

## Solution
Created a comprehensive migration to standardize on lowercase values throughout the system.

## Migration Files

### 1. Database Migration
**File**: `supabase/migrations/20250115_fix_media_type_case_complete.sql`

**What it does**:
- Creates a new ENUM type with lowercase values (`image`, `video`, `pdf`)
- Migrates all existing data from uppercase to lowercase
- Handles multiple tables: `playground_gallery`, `showcase_media`, `moodboard_items`
- Dynamically finds and updates any other tables with `media_type` columns
- Replaces the old ENUM type completely

### 2. API Fixes
Updated the following API endpoints to use lowercase values:

- `apps/web/app/api/playground/save-to-gallery/route.ts`
  - Changed `'IMAGE'` → `'image'`
  - Changed `'VIDEO'` → `'video'`

- `apps/web/app/api/playground/promote-to-media/route.ts`
  - Changed `.toUpperCase()` → `.toLowerCase()`

- `apps/web/app/api/media/upload/route.ts`
  - Changed `'IMAGE'` → `'image'`, `'VIDEO'` → `'video'`

- `apps/web/app/showcases/[id]/page.tsx`
  - Changed `'VIDEO'` → `'video'`

### 3. Testing Script
**File**: `scripts/run-media-type-migration.sql`

Run this script to verify the migration worked correctly.

## How to Apply

1. **Run the migration**:
   ```bash
   # Apply the migration to your Supabase database
   supabase db push
   ```

   The migration will:
   - Create a new ENUM type with lowercase values
   - Migrate all existing data from uppercase to lowercase (handles both cases for safety)
   - Only process tables that actually exist AND have a `media_type` column (or `type` column for the `media` table)
   - Replace the old ENUM type completely
   - Skip tables that don't have the required column (like `moodboard_items` if it doesn't have `media_type` column)
   - Handle the special case of the `media` table which uses `type` instead of `media_type`
   - Use case-insensitive comparisons to handle mixed data states

2. **Verify the migration**:
   ```bash
   # Run the test script to check results
   psql -h your-db-host -U your-user -d your-db -f scripts/run-media-type-migration.sql
   ```

3. **Deploy the API changes**:
   ```bash
   # Deploy the updated API endpoints
   npm run build
   npm run deploy
   ```

## Pages That Will Be Fixed

This migration will fix the following pages/components:

### **Primary Issues Fixed:**
- ✅ **Stitch Import Dialog**: "No saved images yet" → Will show saved images
- ✅ **Saved Images Gallery**: Images will display correctly
- ✅ **Create Showcase Modal**: Playground images will appear in selection

### **Components That Use media_type Filtering:**
- ✅ `StitchImageImportDialog.tsx` - Filters `media_type === 'image'`
- ✅ `TabbedPlaygroundLayout.tsx` - Filters `media_type === 'image'`
- ✅ `SavedImagesMasonry.tsx` - Checks `media_type === 'video'`
- ✅ `CreateShowcaseModal.tsx` - Filters by `media_type === 'image'` and `media_type === 'video'`
- ✅ `useShowcaseMedia.ts` - Filters playground gallery by media type
- ✅ All video/image display logic throughout the app

### **API Endpoints Fixed:**
- ✅ `/api/playground/gallery` - Will return lowercase values
- ✅ `/api/playground/save-to-gallery` - Will save lowercase values
- ✅ `/api/media/upload` - Will save lowercase values
- ✅ `/api/playground/promote-to-media` - Will use lowercase values

### **Database Tables Processed:**
- ✅ **`playground_gallery`** - Uses `media_type` column
- ✅ **`showcase_media`** - Uses `media_type` column  
- ✅ **`moodboard_items`** - Uses `media_type` column (if it exists)
- ✅ **`media`** - Uses `type` column (special case - this was causing the dependency error)
- ✅ **Any other tables** - Automatically discovered if they have `media_type` column

## Expected Results

After the migration:
- All existing records will have lowercase `media_type` values
- New records will be saved with lowercase values
- The "No saved images yet" issue in Stitch import dialog should be resolved
- All media type filtering will work consistently
- No more case mismatch errors in console

## Verification

Check that:
1. Database records show lowercase values: `image`, `video`, `pdf`
2. Stitch import dialog shows saved images
3. All media type comparisons work correctly
4. No console errors related to media type mismatches

## Notes

- PostgreSQL ENUMs cannot remove old values, so `'IMAGE'`, `'VIDEO'`, `'PDF'` will remain in the ENUM but won't be used
- The migration is idempotent - safe to run multiple times
- All frontend code already expected lowercase values, so no frontend changes needed
