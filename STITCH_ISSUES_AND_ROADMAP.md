# Stitch Feature: Issues Analysis & Enhancement Roadmap

## Current Implementation Status

### ✅ What Works
- Multi-image upload (up to 10 images)
- Image labeling system (character, location, style, object, reference, custom)
- Provider selection (Seedream/Nanobanana)
- Basic size selection (square aspect ratios only)
- Cost calculation and credit management
- API integration with both providers
- Generated image preview and saving
- ✅ **FIXED**: NaN rendering errors in UI components

### ❌ Current Limitations

## Issue 0: NaN Rendering Error ✅ FIXED

### Problem
React console error: "Received NaN for the `children` attribute. If this is expected, cast the value to a string."

### Root Cause
Multiple locations in `StitchControlPanel.tsx` were rendering numeric values directly without NaN checks:
1. Cost calculation could produce NaN when `maxImages` was invalid
2. Missing dollar sign in cost display for Nanobanana
3. No NaN safety checks in Input values, button text, and credits display

### Solution Applied
**File**: `/apps/web/app/components/playground/StitchControlPanel.tsx`

**Changes Made**:
1. ✅ Added NaN check in cost calculation (line 72)
   ```typescript
   return isNaN(cost) ? '0.000' : cost.toFixed(3);
   ```

2. ✅ Added missing `$` symbol for Nanobanana cost display (line 244)
   ```typescript
   ? `$${costPerImage} × ${promptMaxImages || 1} images (estimated)`
   ```

3. ✅ Added NaN safety in Input value (line 199)
   ```typescript
   value={isNaN(maxImages) ? '' : maxImages}
   ```

4. ✅ Added NaN check in credits display (line 298)
   ```typescript
   ${isNaN(userCredits) ? '0.00' : userCredits.toFixed(2)}
   ```

5. ✅ Added NaN check in button text (line 296)
   ```typescript
   `Generate ${isNaN(maxImages) ? '?' : maxImages} Image${maxImages !== 1 ? 's' : ''}`
   ```

6. ✅ Enhanced validation to check for NaN (line 80)
   ```typescript
   if (provider === 'seedream' && (isNaN(maxImages) || maxImages < 1 || maxImages > 15)) return false;
   ```

7. ✅ Added NaN validation in handleGenerate (line 126)
   ```typescript
   if (isNaN(cost) || cost <= 0) {
     toast.error('Invalid cost calculation. Please check your settings.');
     return;
   }
   ```

**Status**: ✅ Complete - All NaN rendering issues resolved

---

## Issue 1: Size/Aspect Ratio Compatibility

### Problem Analysis

#### Seedream
- **Current**: Only sends square sizes (1024×1024, 2048×2048, etc.)
- **API Support**: Accepts `size` as "width*height" format
- **Missing**: Non-square aspect ratios (16:9, 9:16, 4:3, 3:4, etc.)

#### Nanobanana
- **Current**: Hardcoded to "1:1" aspect ratio
- **API Support**: Accepts 10 aspect ratios: `1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9`
- **Missing**: Dynamic aspect ratio selection based on size dropdown

### Current Code Issues

**File**: `/app/api/v3/bytedance/seedream-v4/edit-sequential/route.ts:99`
```typescript
// ❌ PROBLEM: Hardcoded to square
const aspectRatio = '1:1'; // Default to square for all sizes in Stitch
```

**File**: `/app/components/playground/StitchControlPanel.tsx:223-228`
```typescript
// ❌ PROBLEM: Only square sizes listed
<SelectItem value="1024">1024×1024 (Standard)</SelectItem>
<SelectItem value="1280">1280×1280</SelectItem>
<SelectItem value="1536">1536×1536</SelectItem>
<SelectItem value="2048">2048×2048 (High Quality)</SelectItem>
<SelectItem value="3072">3072×3072</SelectItem>
<SelectItem value="4096">4096×4096 (Ultra HD)</SelectItem>
```

### Solution Required

#### Option A: Add Aspect Ratio Selector (Recommended)
```typescript
// New UI Component
<Select value={aspectRatio} onValueChange={onAspectRatioChange}>
  <SelectTrigger id="aspect-ratio">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1:1">Square (1:1)</SelectItem>
    <SelectItem value="16:9">Landscape (16:9)</SelectItem>
    <SelectItem value="9:16">Portrait (9:16)</SelectItem>
    <SelectItem value="4:3">Standard (4:3)</SelectItem>
    <SelectItem value="3:4">Portrait (3:4)</SelectItem>
    <SelectItem value="21:9">Ultrawide (21:9)</SelectItem>
    <SelectItem value="3:2">Photo (3:2)</SelectItem>
    <SelectItem value="2:3">Portrait Photo (2:3)</SelectItem>
    <SelectItem value="4:5">Portrait (4:5)</SelectItem>
    <SelectItem value="5:4">Landscape (5:4)</SelectItem>
  </SelectContent>
</Select>
```

#### Option B: Combined Size + Aspect Ratio Dropdown
```typescript
<SelectItem value="1024x1024">1024×1024 (1:1)</SelectItem>
<SelectItem value="1920x1080">1920×1080 (16:9)</SelectItem>
<SelectItem value="1080x1920">1080×1920 (9:16)</SelectItem>
<SelectItem value="1536x864">1536×864 (16:9)</SelectItem>
// etc.
```

#### Implementation Changes Needed

1. **StitchControlPanel.tsx**:
   - Add `aspectRatio` state
   - Add aspect ratio selector UI
   - Update size options to include non-square
   - Pass `aspectRatio` to parent

2. **StitchTab.tsx**:
   - Add `aspectRatio` state
   - Pass to control panel and API

3. **API Route** (`route.ts:90-99`):
   - Remove hardcoded `aspectRatio = '1:1'`
   - Accept `aspectRatio` from request body
   - Calculate `finalSize` based on aspect ratio for Seedream
   - Use provided `aspectRatio` for Nanobanana

4. **Size Calculation Logic**:
```typescript
// Convert aspect ratio to dimensions for Seedream
function calculateDimensions(baseSize: number, aspectRatio: string): string {
  const [width, height] = aspectRatio.split(':').map(Number);
  const ratio = width / height;

  if (ratio > 1) {
    // Landscape
    const w = baseSize;
    const h = Math.round(baseSize / ratio);
    return `${w}*${h}`;
  } else if (ratio < 1) {
    // Portrait
    const h = baseSize;
    const w = Math.round(baseSize * ratio);
    return `${w}*${h}`;
  } else {
    // Square
    return `${baseSize}*${baseSize}`;
  }
}
```

---

## Issue 2: Cinematic Parameters Support

### Problem Analysis

**Current State**: Stitch tab does NOT support cinematic parameters

**Expected**: Users should be able to apply cinematic settings to stitched images

### Missing Features

1. **Cinematic Preset Selection**
   - Film grain
   - Color grading
   - Lighting style
   - Camera angles
   - Shot composition

2. **Cinematic Parameters**
   - Mood (dramatic, bright, dark, etc.)
   - Time of day (golden hour, blue hour, etc.)
   - Weather conditions
   - Camera movement suggestions
   - Lens effects (bokeh, depth of field)

### Current Implementation in Other Tabs

**File**: Check existing cinematic parameters in Generate/Edit tabs:
```bash
grep -r "cinematic" apps/web/app/components/playground/
```

**Expected Structure**:
```typescript
interface CinematicParams {
  mood?: 'dramatic' | 'bright' | 'dark' | 'neutral';
  lighting?: 'natural' | 'studio' | 'golden-hour' | 'blue-hour';
  composition?: 'rule-of-thirds' | 'centered' | 'dynamic';
  camera_angle?: 'eye-level' | 'high-angle' | 'low-angle' | 'dutch-angle';
  lens_effect?: 'bokeh' | 'sharp' | 'soft-focus' | 'vignette';
  color_grade?: 'warm' | 'cool' | 'desaturated' | 'vibrant';
}
```

### Solution Required

1. **Add Cinematic Panel to StitchControlPanel**:
```typescript
// New collapsible section
<Collapsible>
  <CollapsibleTrigger>
    <Film className="h-4 w-4" />
    <span>Cinematic Settings (Optional)</span>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <CinematicParametersPanel
      params={cinematicParams}
      onChange={setCinematicParams}
    />
  </CollapsibleContent>
</Collapsible>
```

2. **Integrate with Prompt**:
```typescript
// Enhance prompt with cinematic parameters
function enhancePromptWithCinematic(
  basePrompt: string,
  cinematic: CinematicParams
): string {
  const additions: string[] = [];

  if (cinematic.mood) additions.push(`${cinematic.mood} mood`);
  if (cinematic.lighting) additions.push(`${cinematic.lighting} lighting`);
  if (cinematic.camera_angle) additions.push(`${cinematic.camera_angle}`);
  if (cinematic.lens_effect) additions.push(`with ${cinematic.lens_effect}`);

  return additions.length > 0
    ? `${basePrompt}, ${additions.join(', ')}`
    : basePrompt;
}
```

3. **API Integration**:
   - Send cinematic params as metadata
   - Append to prompt automatically
   - Save to project record

---

## Issue 3: Preset Integration

### Problem Analysis

**Current State**: NO preset integration in Stitch tab

**Challenge**: How should presets work with multi-image input?

### Preset System Context

From other playground tabs, presets typically contain:
```typescript
interface Preset {
  id: string;
  name: string;
  prompt_template: string;        // e.g., "Portrait of {subject} in {style}"
  style?: string;                 // e.g., "cinematic", "anime", "photorealistic"
  negative_prompt?: string;
  parameters?: {
    guidance_scale?: number;
    steps?: number;
    seed?: number;
  };
  cinematic_params?: CinematicParams;
}
```

### Key Questions

#### Q1: How do presets apply to multiple source images?

**Scenarios**:

**Scenario A: Global Preset Application**
- Preset applies same style/treatment to all images
- Example: "Apply cinematic film noir style to all character/location combinations"
- Prompt: "Create 5 images combining these references in film noir style"

**Scenario B: Per-Image Preset Application**
- Each source image can have its own preset
- Example: Image 1 (character) → "photorealistic", Image 2 (location) → "fantasy art"
- Complex to implement, may confuse users

**Scenario C: Output Preset Application** ⭐ RECOMMENDED
- Preset defines how to combine inputs into outputs
- Preset template variables map to image types
- Example: `"Place {character} in {location} with {style} aesthetic"`

#### Q2: How does the prompt field "know" about each image?

**Current Limitation**:
- User enters free-form prompt: "Create 5 images showing character in different locations"
- System doesn't know which image is which
- Image labels (character, location, style) are metadata only

**Proposed Solution**: **Template Variables Bound to Image Types**

```typescript
interface StitchPreset extends Preset {
  template: string;  // "Place {character} in {location} with {style} lighting"
  image_slots: {
    character: { required: boolean; multiple: boolean };
    location: { required: boolean; multiple: boolean };
    style: { required: boolean; multiple: boolean };
    object: { required: boolean; multiple: boolean };
  };
}
```

**Example Flow**:

1. User selects preset: "Character in Location"
   - Template: `"Place {character} in {location}, {style} aesthetic, cinematic composition"`
   - Required slots: character, location
   - Optional slots: style

2. User uploads images:
   - Image 1 → Label: "character"
   - Image 2 → Label: "location"
   - Image 3 → Label: "style"

3. System validates:
   - ✅ Has character image
   - ✅ Has location image
   - ✅ Has style image

4. System generates prompt:
   ```
   "Place [Image 1: character] in [Image 2: location],
    with [Image 3: style] aesthetic, cinematic composition"
   ```

5. API receives:
   ```json
   {
     "prompt": "Place character in location, with style aesthetic...",
     "images": [
       { "url": "img1.jpg", "type": "character" },
       { "url": "img2.jpg", "type": "location" },
       { "url": "img3.jpg", "type": "style" }
     ]
   }
   ```

### Solution Required

#### 1. Create Stitch-Specific Preset Schema

**File**: Create `/apps/web/lib/presets/stitchPresets.ts`

```typescript
export interface StitchPreset {
  id: string;
  name: string;
  description: string;
  category: 'character' | 'product' | 'scene' | 'style-transfer';

  // Template with placeholders for image types
  prompt_template: string;

  // Define which image types are needed
  required_image_types: ImageType[];
  optional_image_types: ImageType[];

  // Cinematic parameters to apply
  cinematic_params?: CinematicParams;

  // Generation parameters
  max_images_suggestion?: number;
  aspect_ratio_suggestion?: string;

  // Examples to show users
  examples?: {
    input_images: { type: ImageType; description: string }[];
    output_description: string;
  }[];
}

type ImageType = 'character' | 'location' | 'style' | 'object' | 'reference' | 'custom';

// Example presets
export const STITCH_PRESETS: StitchPreset[] = [
  {
    id: 'character-in-locations',
    name: 'Character in Different Locations',
    description: 'Place a character in multiple locations with consistent style',
    category: 'character',
    prompt_template: 'Create {count} images placing {character} in {location}, maintaining {style} aesthetic and cinematic composition',
    required_image_types: ['character', 'location'],
    optional_image_types: ['style'],
    max_images_suggestion: 5,
    aspect_ratio_suggestion: '16:9',
    cinematic_params: {
      mood: 'dramatic',
      lighting: 'natural',
      composition: 'rule-of-thirds'
    },
    examples: [
      {
        input_images: [
          { type: 'character', description: 'Portrait photo of person' },
          { type: 'location', description: '3 different environment photos' },
          { type: 'style', description: 'Reference style image' }
        ],
        output_description: 'Character seamlessly placed in each location with consistent lighting and style'
      }
    ]
  },
  {
    id: 'product-on-backgrounds',
    name: 'Product on Different Backgrounds',
    description: 'Place product on various backgrounds for marketing',
    category: 'product',
    prompt_template: 'Create {count} product shots of {object} on {location} background, {style} photography style, professional lighting',
    required_image_types: ['object', 'location'],
    optional_image_types: ['style'],
    max_images_suggestion: 8,
    aspect_ratio_suggestion: '1:1',
    examples: [
      {
        input_images: [
          { type: 'object', description: 'Product photo with transparent/plain background' },
          { type: 'location', description: 'Multiple background scenes' },
          { type: 'style', description: 'Photography style reference' }
        ],
        output_description: 'Product professionally composited on each background'
      }
    ]
  },
  {
    id: 'style-transfer-multi',
    name: 'Apply Style to Multiple Images',
    description: 'Apply artistic style to multiple source images',
    category: 'style-transfer',
    prompt_template: 'Create {count} images applying {style} artistic style to {reference} images, maintaining composition and subject',
    required_image_types: ['style', 'reference'],
    optional_image_types: [],
    max_images_suggestion: 4,
    aspect_ratio_suggestion: '1:1',
    cinematic_params: {
      mood: 'neutral',
      color_grade: 'vibrant'
    }
  }
];
```

#### 2. Add Preset Selector to StitchControlPanel

```typescript
// New section at top of StitchControlPanel
<div className="space-y-2">
  <Label>Preset (Optional)</Label>
  <Select value={selectedPreset?.id} onValueChange={handlePresetChange}>
    <SelectTrigger>
      <SelectValue placeholder="Choose a preset or write custom prompt" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">No Preset (Custom)</SelectItem>
      {STITCH_PRESETS.map((preset) => (
        <SelectItem key={preset.id} value={preset.id}>
          {preset.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {selectedPreset && (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription className="text-xs">
        <strong>Required images:</strong> {selectedPreset.required_image_types.join(', ')}
        <br />
        {selectedPreset.optional_image_types.length > 0 && (
          <>
            <strong>Optional:</strong> {selectedPreset.optional_image_types.join(', ')}
          </>
        )}
      </AlertDescription>
    </Alert>
  )}
</div>
```

#### 3. Implement Template Variable Replacement

**File**: Create `/apps/web/lib/stitchPromptBuilder.ts`

```typescript
export function buildStitchPrompt(
  preset: StitchPreset,
  images: StitchImage[],
  customPrompt?: string,
  maxImages?: number
): { prompt: string; warnings: string[] } {
  const warnings: string[] = [];

  // Check if required image types are present
  const imageTypeMap = new Map<string, StitchImage[]>();
  images.forEach((img) => {
    const type = img.type === 'custom' && img.customLabel
      ? img.customLabel
      : img.type;
    if (!imageTypeMap.has(type)) {
      imageTypeMap.set(type, []);
    }
    imageTypeMap.get(type)!.push(img);
  });

  // Validate required types
  preset.required_image_types.forEach((type) => {
    if (!imageTypeMap.has(type)) {
      warnings.push(`Missing required image type: ${type}`);
    }
  });

  // Build prompt from template
  let prompt = customPrompt || preset.prompt_template;

  // Replace {count}
  if (maxImages) {
    prompt = prompt.replace('{count}', maxImages.toString());
  }

  // Replace image type placeholders with descriptors
  preset.required_image_types.forEach((type) => {
    const regex = new RegExp(`\\{${type}\\}`, 'g');
    const count = imageTypeMap.get(type)?.length || 0;
    const descriptor = count === 1 ? 'the character' : `${count} characters`;
    prompt = prompt.replace(regex, descriptor);
  });

  preset.optional_image_types?.forEach((type) => {
    const regex = new RegExp(`\\{${type}\\}`, 'g');
    const count = imageTypeMap.get(type)?.length || 0;
    if (count > 0) {
      const descriptor = `the ${type}`;
      prompt = prompt.replace(regex, descriptor);
    } else {
      // Remove optional placeholders if not present
      prompt = prompt.replace(regex, '');
    }
  });

  // Clean up extra spaces and punctuation
  prompt = prompt.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').trim();

  return { prompt, warnings };
}
```

#### 4. Update StitchTab to Use Presets

```typescript
// In StitchTab.tsx
const [selectedPreset, setSelectedPreset] = useState<StitchPreset | null>(null);
const [customPrompt, setCustomPrompt] = useState('');

// When preset changes, update prompt and settings
useEffect(() => {
  if (selectedPreset) {
    const { prompt, warnings } = buildStitchPrompt(
      selectedPreset,
      sourceImages,
      customPrompt,
      maxImages
    );

    setPrompt(prompt);

    // Apply suggested settings
    if (selectedPreset.max_images_suggestion) {
      setMaxImages(selectedPreset.max_images_suggestion);
    }
    if (selectedPreset.aspect_ratio_suggestion) {
      setAspectRatio(selectedPreset.aspect_ratio_suggestion);
    }
    if (selectedPreset.cinematic_params) {
      setCinematicParams(selectedPreset.cinematic_params);
    }

    // Show warnings
    warnings.forEach((warning) => {
      toast.warning(warning);
    });
  }
}, [selectedPreset, sourceImages, maxImages]);
```

#### 5. Add Image Type Validation UI

```typescript
// In StitchImageManager.tsx
// Show badges indicating which required types are fulfilled
{selectedPreset && (
  <div className="flex flex-wrap gap-2 p-2 border rounded">
    {selectedPreset.required_image_types.map((type) => {
      const hasType = images.some((img) => img.type === type);
      return (
        <Badge
          key={type}
          variant={hasType ? 'default' : 'outline'}
          className={hasType ? 'bg-green-500' : 'bg-red-500'}
        >
          {hasType ? '✓' : '✗'} {type}
        </Badge>
      );
    })}
  </div>
)}
```

---

## Implementation Roadmap

### Phase 1: Aspect Ratio Support (Priority: HIGH)
**Estimated Time**: 4-6 hours

- [ ] Add aspect ratio state to StitchTab
- [ ] Add aspect ratio selector UI to StitchControlPanel
- [ ] Update size dropdown to include non-square options
- [ ] Implement dimension calculation logic
- [ ] Update API route to handle aspect ratios
- [ ] Test with both Seedream and Nanobanana
- [ ] Update documentation

**Files to Modify**:
1. `/apps/web/app/components/playground/tabs/StitchTab.tsx`
2. `/apps/web/app/components/playground/StitchControlPanel.tsx`
3. `/apps/web/app/api/v3/bytedance/seedream-v4/edit-sequential/route.ts`

### Phase 2: Cinematic Parameters (Priority: MEDIUM)
**Estimated Time**: 3-4 hours

- [ ] Extract/reuse cinematic parameter component from other tabs
- [ ] Add cinematic params state to StitchTab
- [ ] Integrate CinematicParametersPanel
- [ ] Implement prompt enhancement logic
- [ ] Add collapsible section in UI
- [ ] Save cinematic params with project
- [ ] Test with sample generations

**Files to Create/Modify**:
1. `/apps/web/app/components/playground/CinematicParametersPanel.tsx` (reuse if exists)
2. `/apps/web/app/components/playground/tabs/StitchTab.tsx`
3. `/apps/web/app/components/playground/StitchControlPanel.tsx`
4. `/apps/web/lib/promptEnhancer.ts` (new)

### Phase 3: Preset System (Priority: HIGH)
**Estimated Time**: 6-8 hours

- [ ] Design stitch preset schema
- [ ] Create preset data structure
- [ ] Implement template variable system
- [ ] Build prompt builder with validation
- [ ] Create preset selector UI
- [ ] Add image type validation badges
- [ ] Create 5-10 example presets
- [ ] Add preset preview/examples
- [ ] Integrate with existing preset marketplace
- [ ] Test end-to-end flows

**Files to Create**:
1. `/apps/web/lib/presets/stitchPresets.ts`
2. `/apps/web/lib/stitchPromptBuilder.ts`
3. `/apps/web/types/stitchPreset.ts`

**Files to Modify**:
1. `/apps/web/app/components/playground/tabs/StitchTab.tsx`
2. `/apps/web/app/components/playground/StitchControlPanel.tsx`
3. `/apps/web/app/components/playground/StitchImageManager.tsx`

### Phase 4: Testing & Documentation (Priority: HIGH)
**Estimated Time**: 2-3 hours

- [ ] Test all aspect ratios with both providers
- [ ] Test cinematic parameter application
- [ ] Test preset flows with various image combinations
- [ ] Test validation and warnings
- [ ] Create user guide
- [ ] Update API documentation
- [ ] Create video tutorial

---

## Success Metrics

- [ ] All 10 Nanobanana aspect ratios supported
- [ ] Non-square sizes work correctly with Seedream
- [ ] Cinematic parameters enhance prompts appropriately
- [ ] Preset validation catches missing image types
- [ ] Template variables correctly map to images
- [ ] 90% of users understand preset system
- [ ] Generated results match preset expectations

---

## Next Steps After Stitch Completion

As per PLAYGROUND_REFACTORING_PLAN.md, proceed to:

**Phase 2.2**: Refactor PresetSelector (1,391 lines)
- Extract preset search logic
- Create preset card components
- Implement preset filtering hooks
- Separate cinematic preset handling

---

## Questions for Discussion

1. **Aspect Ratios**: Should we show different aspect ratios per provider, or unified list?
2. **Presets**: Should stitch presets be in marketplace, or built-in only?
3. **Validation**: Should we block generation if required image types missing, or just warn?
4. **Cinematic**: Should cinematic params be separate section or integrated into preset?
5. **Image Slots**: Should we allow multiple images per type (e.g., 3 locations)?

---

## References

- Seedream API: `https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit-sequential`
- Nanobanana API: `https://api.wavespeed.ai/api/v3/google/nano-banana/edit`
- Current Implementation: `/apps/web/app/components/playground/tabs/StitchTab.tsx`
- Refactoring Plan: `/apps/web/app/playground/PLAYGROUND_REFACTORING_PLAN.md`
