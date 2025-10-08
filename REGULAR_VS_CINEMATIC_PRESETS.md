# Regular vs Cinematic Presets: Complete Comparison

## Overview

Your system has **two separate preset tables** that are unified in the API:
- `presets` (Regular Presets) - 68 presets
- `cinematic_presets` (Cinematic Presets) - 10 presets

## Key Differences

### 1. **Primary Purpose**

| Aspect | Regular Presets | Cinematic Presets |
|--------|----------------|------------------|
| **Main Use** | Image generation (photos, art, styles) | Video generation with cinematic effects |
| **Focus** | Static visual styles | Motion, camera movements, cinematic atmosphere |
| **Categories** | Photography, product, headshots, artistic | Film-like, directorial, motion-based |

### 2. **Database Schema - What's Different**

Both tables have **identical base columns**, but they differ in how fields are used:

```sql
-- Both have these core fields:
- id, user_id, name, display_name, description
- category, prompt_template, prompt_template_video
- style_settings, technical_settings, cinematic_settings
- ai_metadata, seedream_config
- generation_mode, is_public, is_featured
- usage_count, likes_count, created_at, updated_at
- marketplace fields (is_for_sale, sale_price, etc.)
```

### 3. **The Special Field: `cinematic_settings`**

This is where the real difference lies:

#### **Regular Presets (`presets` table)**
- `cinematic_settings`: Usually **empty** `{}` or minimal
- Focus on `style_settings` and `technical_settings`
- Used for image generation parameters

#### **Cinematic Presets (`cinematic_presets` table)**
- `cinematic_settings`: **Rich with video-specific data**
- Contains cinematic parameters like:
  ```json
  {
    "cinematicParameters": {
      "cameraMovement": "slow_zoom_in",
      "shotType": "medium_shot",
      "lighting": "dramatic",
      "sceneMood": "mysterious",
      "colorGrading": "cool_tones",
      "frameComposition": "rule_of_thirds",
      "depthOfField": "shallow",
      "motionBlur": "subtle"
    },
    "enableCinematicMode": true,
    "includeTechnicalDetails": true,
    "includeStyleReferences": true
  }
  ```

### 4. **Categories**

#### **Regular Preset Categories** (from constraint)
```
'style', 'effects', 'cinematic', 'technical', 'custom',
'headshot', 'product_photography', 'instant_film',
'wedding_events', 'real_estate', 'fashion_lifestyle',
'food_culinary', 'pet_animal', 'travel_landscape',
'artistic', 'corporate_portrait', 'ecommerce',
'linkedin_photo', 'product_lifestyle', 'product_studio'
```

#### **Cinematic Preset Categories**
- Typically: `'cinematic'`
- Named after famous directors or film styles
- Examples: "Christopher Nolan", "Roger Deakins", "Wes Anderson"

### 5. **How They're Used**

#### **Regular Presets**
```typescript
// Image Generation Panel
const preset = getPreset('regular')
// Uses: prompt_template, style_settings, technical_settings
// Generates: Photos, illustrations, artistic images
// Providers: NanoBanana, Seedream
```

#### **Cinematic Presets**
```typescript
// Video Generation Panel
const preset = getPreset('cinematic')
// Uses: prompt_template_video, cinematic_settings
// Generates: Videos with camera movements, motion effects
// Providers: Seedream (image-to-video), Wan (text-to-video)
```

### 6. **Prompt Templates**

Both tables have:
- `prompt_template` - For image generation
- `prompt_template_video` - For video generation

**Regular Presets:**
```
prompt_template: "Create a professional headshot of {subject} with..."
prompt_template_video: null (or same as prompt_template)
```

**Cinematic Presets:**
```
prompt_template: "Capture {subject} in the style of Christopher Nolan..."
prompt_template_video: "Animate {subject} with dramatic camera movements..."
```

### 7. **API Unification**

In `/api/presets/route.ts`, both tables are fetched and unified:

```typescript
const [regularPresetsResult, cinematicPresetsResult] = await Promise.all([
  supabase.from('presets').select(...),
  supabase.from('cinematic_presets').select(...)
]);

// Combined with preset_type flag
const allPresets = [
  ...regularPresetsResult.data.map(p => ({ ...p, preset_type: 'regular' })),
  ...cinematicPresetsResult.data.map(p => ({ ...p, preset_type: 'cinematic' }))
];
```

The `preset_type` field tells the frontend which type it is.

### 8. **UI Differences**

#### **PresetSelector Component**
Shows a badge based on `preset_type`:
- **Regular**: Wand icon + "Style" badge
- **Cinematic**: Camera icon + "Cinematic" badge

```typescript
const getPresetTypeBadge = (presetId: string) => {
  const type = getPresetType(presetId)
  if (type === 'cinematic') {
    return <Badge><Camera /> Cinematic</Badge>
  }
  return <Badge><Wand2 /> Style</Badge>
}
```

### 9. **When To Use Which**

#### **Use Regular Presets For:**
- 📸 Professional headshots
- 🛍️ Product photography
- 🎨 Artistic styles (watercolor, oil painting, etc.)
- 📷 Instant film effects (Polaroid, Fujifilm)
- 🏠 Real estate photography
- 👗 Fashion and lifestyle images
- 🍕 Food photography
- 🐕 Pet portraits
- ✈️ Travel and landscape photos

#### **Use Cinematic Presets For:**
- 🎬 Video generation with professional camera work
- 🎥 Film-like motion and atmosphere
- 📹 Director-inspired video styles
- 🎞️ Cinematic color grading and lighting
- 🎪 Motion graphics with dramatic effects

### 10. **Example Workflow**

#### **Regular Preset Workflow**
```
1. User selects "Professional Headshot" preset
2. System loads preset from 'presets' table
3. Uses style_settings: {style: "portrait", resolution: "1024"}
4. Generates static image with NanoBanana
5. Result: Professional headshot photo
```

#### **Cinematic Preset Workflow**
```
1. User selects "Christopher Nolan Cinematic" preset
2. System loads preset from 'cinematic_presets' table
3. Uses cinematic_settings: {
     cameraMovement: "slow_zoom_in",
     lighting: "dramatic",
     sceneMood: "intense"
   }
4. Generates video with Wan or Seedream
5. Result: Video with Nolan-style cinematography
```

### 11. **ID Prefixes**

While not enforced in the database, the code uses a convention:

```typescript
// Regular presets: UUID without prefix
id: "58e83a78-53c7-4c85-ac46-a1fbdd116e5b"

// Cinematic presets: Often prefixed with "cinematic_"
id: "cinematic_b2a53172-f4aa-48af-8850-3d0248cb3115"
// (but this is just a convention, not a database constraint)
```

### 12. **Current Distribution**

From your database:
```
Regular Presets:   68 presets
Cinematic Presets: 10 presets

Total: 78 presets
```

### 13. **Backend Processing**

#### **Image Generation (Regular Presets)**
```typescript
// Uses style_settings
const settings = {
  style: preset.style_settings.style,
  resolution: preset.technical_settings.resolution,
  num_images: preset.technical_settings.num_images
}
```

#### **Video Generation (Cinematic Presets)**
```typescript
// Uses cinematic_settings
const settings = {
  cinematicParameters: preset.cinematic_settings.cinematicParameters,
  duration: 5,
  aspectRatio: preset.technical_settings.aspectRatio
}
```

## Summary: What Makes Them Different?

| Feature | Regular Presets | Cinematic Presets |
|---------|----------------|------------------|
| **Primary Output** | Images | Videos |
| **Key Settings** | `style_settings` | `cinematic_settings` |
| **Use Case** | Photography, art, graphics | Film-like video content |
| **Parameters** | Style, resolution, intensity | Camera movement, lighting, mood |
| **Badge Icon** | 🪄 Wand (Style) | 🎥 Camera (Cinematic) |
| **Categories** | 20+ photography types | Cinematic/directorial |
| **Providers** | NanoBanana, Seedream | Seedream, Wan |
| **Count** | 68 presets | 10 presets |

## Technical Note

Despite being in separate tables, **both types are treated identically** in most of the codebase:
- Same API endpoint (`/api/presets`)
- Same frontend components
- Same marketplace features
- Same promotion system
- Same usage tracking

The main difference is **what's inside `cinematic_settings`** and **how they're used during generation**.

## Why Two Tables?

Historically, cinematic presets were probably added later as a specialized feature for video generation. They could have been a single table, but separating them:
- ✅ Keeps video-specific logic isolated
- ✅ Allows different constraints/validations
- ✅ Makes queries more efficient (smaller result sets)
- ✅ Provides clearer data organization

The API unifies them for the frontend, giving users a seamless experience where they see "all presets" regardless of type.
