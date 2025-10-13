# Enhancement Source Image Metadata Fix

## Problem

When an image was enhanced and saved from the enhancer to the playground gallery, the source/base image metadata wasn't displaying correctly. Instead of showing the actual source image, it just displayed:

```
Source Image:
📝 Text-to-Image
```

Even though the image was created using Image-to-Image enhancement (not Text-to-Image).

## Root Cause

There was a mismatch between how the metadata was being saved and how it was being read:

1. **When saving** (`MoodboardBuilder.tsx` line 906):
   - The source image URL was stored as `original_image_url` in `generation_metadata`
   - No `base_image` field was set
   - No `generation_mode` field was set

2. **When displaying** (`SavedImagesMasonry.tsx` line 1146):
   - The UI was only checking for `metadata.base_image`
   - It wasn't checking for `metadata.original_image_url`
   - Without finding a source image, it defaulted to showing "📝 Text-to-Image"

## Solution

### Part 1: Update Save Logic (`MoodboardBuilder.tsx`)

Updated the `handleSaveToGallery` function to include both field names and explicitly set the generation mode:

```typescript
const generationMetadata = metadata ? {
  enhancement_type: metadata.enhancementType,
  prompt: metadata.prompt,
  provider: metadata.provider,
  original_image_url: metadata.originalImageUrl,
  base_image: metadata.originalImageUrl, // NEW: Also store as base_image for UI compatibility
  generation_mode: 'image-to-image', // NEW: Explicitly set generation mode
  enhanced_at: new Date().toISOString()
} : {}
```

**Changes:**
- Added `base_image` field pointing to the same source image URL
- Added `generation_mode: 'image-to-image'` to explicitly mark enhancements
- This ensures new enhancements will work with the UI

### Part 2: Update Display Logic (`SavedImagesMasonry.tsx`)

Updated the source image display to check both field names for backwards compatibility:

```typescript
const metadata = selectedImageForInfo.generation_metadata as any;
// Check for both base_image and original_image_url for backwards compatibility
const sourceImage = metadata.base_image || metadata.original_image_url;

{sourceImage ? (
  <img 
    src={sourceImage} 
    alt="Source/Base image" 
    className="w-16 h-16 object-cover rounded border"
  />
) : (
  <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
    📝 Text-to-Image
  </div>
)}
```

**Changes:**
- Check for both `base_image` AND `original_image_url`
- This ensures both new AND old saved enhancements will display correctly
- Updated alt text to "Source/Base image" for clarity

## Benefits

1. ✅ **Source images now display correctly** for all new enhancements
2. ✅ **Backwards compatible** - old saved images with `original_image_url` will also work
3. ✅ **Generation mode properly set** - enhancements are correctly identified as "Image-to-Image"
4. ✅ **Better user experience** - users can see what image they started with

## Testing

To verify the fix:

1. **Test New Enhancements:**
   - Go to Moodboard Builder
   - Enhance an existing image
   - Save the enhanced result to gallery
   - View the image info in playground gallery
   - Confirm source image thumbnail displays correctly

2. **Test Old Entries:**
   - View previously saved enhanced images
   - Confirm they now display source images (if they had `original_image_url`)

3. **Test Text-to-Image:**
   - Create a new text-to-image generation
   - Save to gallery
   - Confirm it still shows "📝 Text-to-Image" (no source image)

## Related Files

- `apps/web/app/components/MoodboardBuilder.tsx` - Enhancement save logic
- `apps/web/app/components/playground/SavedImagesMasonry.tsx` - Gallery display UI
- `apps/web/app/components/EnhancedEnhancementModal.tsx` - Enhancement modal (passes metadata)

## Database Schema

The fix works with the existing `playground_gallery` table schema:

```sql
CREATE TABLE playground_gallery (
  ...
  generation_metadata JSONB, -- Stores all generation parameters
  ...
);
```

No database migration needed - this is a code-level fix for metadata structure.

## Date

Fixed: October 12, 2025

