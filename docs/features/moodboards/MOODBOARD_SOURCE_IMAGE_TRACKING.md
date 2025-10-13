# Moodboard Source Image Tracking Enhancement

## Overview

Enhanced the moodboard enhancement system to properly track and display source images, since moodboards don't have text-to-image generation - all enhancements are based on existing images.

## Key Improvements

### 1. **Enhanced Metadata Structure** (`MoodboardBuilder.tsx`)

Added comprehensive source image tracking to the enhancement metadata:

```typescript
const generationMetadata = {
  // Core enhancement data
  enhancement_type: metadata.enhancementType,
  prompt: metadata.prompt,
  provider: metadata.provider,
  original_image_url: metadata.originalImageUrl, // Source image URL from moodboard
  base_image: metadata.originalImageUrl, // Also store as base_image for UI compatibility
  generation_mode: 'image-to-image', // Moodboard enhancements are always image-to-image
  enhanced_at: new Date().toISOString(),
  
  // Source image metadata for better tracking
  source_type: 'moodboard_image', // Indicates this came from a moodboard
  has_source_image: true, // Always true for moodboard enhancements
  
  // ... rest of playground-compatible metadata
}
```

**New Fields Added:**
- ✅ `source_type: 'moodboard_image'` - Clearly identifies moodboard enhancements
- ✅ `has_source_image: true` - Explicitly marks that a source image exists
- ✅ `original_image_url` - Stores the source image URL from the moodboard
- ✅ `base_image` - Duplicate field for UI compatibility

### 2. **Enhanced Source Image Display** (`SavedImagesMasonry.tsx`)

Improved the source image display to show more context and better distinguish between different types:

```typescript
{sourceImage ? (
  <div className="flex items-center gap-2">
    <img 
      src={sourceImage} 
      alt="Source/Base image" 
      className="w-16 h-16 object-cover rounded border"
    />
    {sourceType === 'moodboard_image' && (
      <div className="text-xs text-muted-foreground">
        <div>📋 From Moodboard</div>
        <div className="text-xs opacity-75">Image-to-Image</div>
      </div>
    )}
  </div>
) : (
  <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
    {hasSourceImage ? '🖼️ Image-to-Image' : '📝 Text-to-Image'}
  </div>
)}
```

**Display Improvements:**
- ✅ **Source image thumbnail** - Shows actual source image when available
- ✅ **Moodboard indicator** - "📋 From Moodboard" label for moodboard enhancements
- ✅ **Generation type clarity** - "Image-to-Image" vs "Text-to-Image" distinction
- ✅ **Backwards compatibility** - Works with both old and new metadata formats

## Expected Results

### **For Moodboard Enhancements:**
When viewing an enhanced image from a moodboard, users will see:

```
Source Image:
[🖼️ Source Image Thumbnail] 📋 From Moodboard
                          Image-to-Image
```

### **For Playground Text-to-Image:**
When viewing a text-to-image generation:

```
Source Image:
📝 Text-to-Image
```

### **For Playground Image-to-Image:**
When viewing an image-to-image generation:

```
Source Image:
[🖼️ Source Image Thumbnail]
```

## Benefits

### ✅ **Clear Source Tracking**
- Always shows the source image for moodboard enhancements
- No confusion about whether an image was enhanced from an existing image
- Proper attribution and traceability

### ✅ **Better User Experience**
- Visual confirmation of what image was enhanced
- Clear indication that moodboard enhancements are image-to-image
- Consistent metadata structure across the platform

### ✅ **Future-Proof Design**
- `source_type` field allows for different enhancement sources
- `has_source_image` flag enables better UI logic
- Compatible with existing playground image metadata

## Technical Implementation

### **Data Flow:**
1. **Enhancement Modal** → Passes `originalImageUrl` in metadata
2. **Moodboard Builder** → Saves comprehensive metadata with source tracking
3. **Gallery Display** → Shows source image thumbnail and context
4. **Metadata Modal** → Displays all enhancement details with source reference

### **Backwards Compatibility:**
- Checks both `base_image` and `original_image_url` fields
- Works with existing saved images that only have basic metadata
- Graceful fallback for images without source tracking

## Files Modified

1. **`apps/web/app/components/MoodboardBuilder.tsx`**
   - Enhanced `handleSaveToGallery` function (lines 901-931)
   - Added source tracking metadata fields
   - Improved comments for clarity

2. **`apps/web/app/components/playground/SavedImagesMasonry.tsx`**
   - Enhanced source image display logic (lines 1140-1173)
   - Added moodboard-specific indicators
   - Improved visual presentation

## Testing Scenarios

### **Test 1: New Moodboard Enhancement**
1. Go to a gig with a moodboard
2. Enhance an existing image
3. Save to gallery
4. View image metadata
5. ✅ Should show source image thumbnail + "📋 From Moodboard"

### **Test 2: Playground Text-to-Image**
1. Generate an image in playground
2. Save to gallery
3. View image metadata
4. ✅ Should show "📝 Text-to-Image"

### **Test 3: Playground Image-to-Image**
1. Generate an image-to-image in playground
2. Save to gallery
3. View image metadata
4. ✅ Should show source image thumbnail

### **Test 4: Old Saved Images**
1. View previously saved enhanced images
2. ✅ Should work with existing metadata (backwards compatible)

## Future Enhancements

1. **Source Image Click-through:** Make source image thumbnail clickable to view full size
2. **Source Image Info:** Show source image dimensions, format, etc.
3. **Enhancement Chain:** Track multiple enhancements of the same source image
4. **Source Image Search:** Filter gallery by source images
5. **Source Image Replacement:** Allow swapping source images for existing enhancements

## Date

Implemented: October 12, 2025
