# Video Preset System Analysis & Implementation Plan

## Current State

### 1. **Two-Dimensional Preset System**

The preset system currently has **TWO separate dimensions**:

#### **Dimension 1: Output Type** (`generation_mode` column)
- `image` - Generates images only
- `video` - Generates videos only
- `both` - Can generate both images and videos

#### **Dimension 2: Input Mode** (`technical_settings->generation_mode`)
- `text-to-image` - Best with text prompts
- `image-to-image` - Best with base image input
- `flexible` - Works with both text and image inputs

### 2. **Current Video Providers**

The system supports two video generation providers:

#### **Seedream** (Image-to-Video ONLY)
- ✅ Requires an image as input
- ❌ Cannot do text-to-video
- Cost: 8 credits base

#### **Wan** (Both Text-to-Video AND Image-to-Video)
- ✅ Supports text-to-video (pure text description)
- ✅ Supports image-to-video (animate existing image)
- Cost: 12 credits base
- Duration: 5s or 10s only

### 3. **How Video Presets Currently Work**

Looking at [VideoGenerationPanel.tsx:108-131](apps/web/app/components/playground/VideoGenerationPanel.tsx#L108-L131):

```typescript
// Video presets are dynamically adapted from IMAGE presets
useEffect(() => {
  if (selectedPreset) {
    // Can use prompt_template_video if exists, or adapts prompt_template
    const promptToUse = selectedPreset.prompt_template_video || selectedPreset.prompt_template
    setVideoPrompt(promptToUse)

    // Applies aspect ratio from technical_settings
    if (selectedPreset.technical_settings?.aspect_ratio) {
      setSelectedAspectRatio(selectedPreset.technical_settings.aspect_ratio)
    }

    // Applies cinematic parameters if available
    if (selectedPreset.cinematic_settings) {
      setEnableCinematicMode(true)
      setCinematicParameters(selectedPreset.cinematic_settings.cinematicParameters || {})
    }
  }
}, [selectedPreset])
```

### 4. **Dynamic Mode Detection**

The system **automatically detects** the appropriate mode at [VideoGenerationPanel.tsx:659-669](apps/web/app/components/playground/VideoGenerationPanel.tsx#L659-L669):

```typescript
{/* Generation Mode Info */}
<div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
  <Label className="text-sm font-medium">
    {getCurrentImage() ? 'Image-to-Video' : 'Text-to-Video'} Mode
  </Label>
  <p className="text-xs text-muted-foreground">
    {getCurrentImage()
      ? 'Animating your selected image with motion effects'
      : 'Generate a video from text description'}
  </p>
</div>
```

## ✅ What You Already Have

### **A Smart, Flexible System!**

1. **Dynamic Adaptation**: Image presets automatically work for video generation
2. **Mode Auto-Detection**: System detects image-to-video vs text-to-video based on whether an image is present
3. **Provider Awareness**: UI shows warnings when Seedream is selected without an image
4. **Dual-Purpose Presets**: All 69 presets with `generation_mode='both'` can be used for video

### **Example Flow**

```
User selects "Cinematic Portrait" preset (generation_mode='both')
  ↓
User is on Video tab
  ↓
If user uploads image → Image-to-Video mode
  → Preset prompt template: "Apply cinematic lighting to {subject}"
  → Final: "Apply cinematic lighting to this image"

If no image → Text-to-Video mode (Wan only)
  → Preset prompt template: "Apply cinematic lighting to {subject}"
  → User enters "a woman walking"
  → Final: "Apply cinematic lighting to a woman walking"
```

## 🎯 Recommendations

### **Option 1: Keep Current System (RECOMMENDED)**

**Why?** Your system is already sophisticated and flexible!

✅ **Advantages:**
- No new presets needed
- All existing presets work for video
- Dynamic mode detection is elegant
- Less database complexity
- Easier maintenance

**What to add:**
1. ✅ Already done: Badge system showing preset's recommended input mode
2. ✅ Already done: Contextual hints in preset selector
3. **NEW**: Add video-specific badges in video tab

### **Option 2: Create Dedicated Video Presets**

Create new presets with `generation_mode='video'` only.

❌ **Disadvantages:**
- Duplicates existing presets
- Users confused about which to use
- More database entries
- Harder to maintain

✅ **Advantages:**
- Can have video-specific prompt templates
- Can set different default settings for video

## 🚀 Implementation Plan

### **Phase 1: Enhance Video Badge System** (30 min)

Add generation mode badges to the **Video tab** to show how presets work with video:

```typescript
// In VideoGenerationPanel.tsx or PresetSelector when on video tab
const getVideoModeBadge = (preset: Preset, hasImage: boolean) => {
  const mode = preset.technical_settings?.generation_mode

  if (mode === 'text-to-image') {
    return (
      <Badge variant="outline" className="border-blue-500 text-blue-600">
        📝 Best for: Text-to-Video
      </Badge>
    )
  }

  if (mode === 'image-to-image') {
    return (
      <Badge variant="outline" className="border-purple-500 text-purple-600">
        🎬 Best for: Image-to-Video
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-green-500 text-green-600">
      ✨ Works with: Both modes
    </Badge>
  )
}
```

### **Phase 2: Provider-Aware Hints** (20 min)

Show smart hints based on provider + preset combination:

```typescript
{selectedPreset && selectedProvider === 'seedream' &&
 selectedPreset.technical_settings?.generation_mode === 'text-to-image' && (
  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
    💡 This preset works best with text prompts, but Seedream requires an image.
    Consider switching to Wan provider for optimal results.
  </div>
)}

{selectedPreset && !getCurrentImage() &&
 selectedPreset.technical_settings?.generation_mode === 'image-to-image' && (
  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
    💡 This preset is optimized for image-to-video. Upload or select an image for best results.
  </div>
)}
```

### **Phase 3: Add Video-Specific Prompt Templates** (Optional - 15 min)

For presets where video needs different prompts than images:

```sql
-- Add prompt_template_video column (already exists in some tables)
ALTER TABLE presets
ADD COLUMN IF NOT EXISTS prompt_template_video TEXT;

-- Example: Update specific presets with video-specific templates
UPDATE presets
SET prompt_template_video = 'Animate {subject} with smooth, cinematic camera movement'
WHERE name = 'Cinematic Portrait'
  AND prompt_template_video IS NULL;
```

## 📊 Current Preset Distribution

From your SQL output:

```
Total Presets: 69
- generation_mode (output): ALL set to 'both' ✅
- recommended_input_mode: ALL set to 'flexible' ✅
```

This means:
- ✅ All 69 presets can be used for video generation
- ✅ All work with text-to-video AND image-to-video
- ✅ No presets need updating

## 🎨 UI/UX Enhancements

### **Preset Detail Page**

Add to [presets/[id]/page.tsx](apps/web/app/presets/[id]/page.tsx):

```typescript
{/* Video Generation Support */}
{preset.generation_mode === 'both' || preset.generation_mode === 'video' && (
  <div className="mb-4">
    <h3 className="text-sm font-semibold mb-2">Video Generation</h3>
    <div className="flex gap-2">
      <Badge variant="outline" className="border-green-500 text-green-600">
        🎬 Supports Video Generation
      </Badge>

      {preset.technical_settings?.generation_mode === 'flexible' && (
        <>
          <Badge variant="outline">📝 Text-to-Video</Badge>
          <Badge variant="outline">🖼️ Image-to-Video</Badge>
        </>
      )}

      {preset.technical_settings?.generation_mode === 'text-to-image' && (
        <Badge variant="outline">📝 Best for Text-to-Video</Badge>
      )}

      {preset.technical_settings?.generation_mode === 'image-to-image' && (
        <Badge variant="outline">🖼️ Best for Image-to-Video</Badge>
      )}
    </div>

    <p className="text-xs text-muted-foreground mt-2">
      This preset can be used in the Video tab with {
        preset.technical_settings?.generation_mode === 'flexible'
          ? 'both Seedream (image-to-video) and Wan (text-to-video + image-to-video)'
          : preset.technical_settings?.generation_mode === 'text-to-image'
            ? 'Wan provider for text-to-video'
            : 'both Seedream and Wan for image-to-video'
      }
    </p>
  </div>
)}
```

### **Playground Video Tab**

Already shows mode detection! Just need to add preset badges.

## 🔍 Summary

### **You DON'T need:**
- ❌ New video presets
- ❌ Database schema changes for video modes
- ❌ Separate video preset creation flow

### **You ALREADY have:**
- ✅ Dynamic image-to-video / text-to-video detection
- ✅ Provider-aware warnings (Seedream requires image)
- ✅ All 69 presets support video generation
- ✅ Automatic prompt template adaptation
- ✅ Smart mode badge system for images

### **You SHOULD add:**
- 🎯 Video mode badges in video tab (same as image tab badges)
- 🎯 Provider + preset compatibility hints
- 🎯 Video support indicators on preset detail pages
- 🎯 (Optional) Video-specific prompt templates for select presets

## 🎬 Next Steps

Would you like me to:

1. **Add video mode badges to the video tab** (uses existing badge system)
2. **Add provider-aware hints** (smart recommendations based on preset + provider)
3. **Enhance preset detail pages** to show video generation support
4. **Create a few video-specific prompt templates** for presets that benefit from different video prompts

Let me know which you'd like to implement first!
