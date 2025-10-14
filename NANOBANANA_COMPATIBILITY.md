# Nanobanana Provider Compatibility

## Overview
The Stitch feature now supports both **Seedream** and **Nanobanana** providers with automatic schema adaptation based on provider selection.

## Provider Differences

### Seedream (Recommended)
- **Endpoint**: `https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit-sequential`
- **Max Images**: User-controlled via `max_images` parameter (1-15)
- **Size Control**: Uses `size` parameter as "width*height" (e.g., "1024*1024")
- **Image Format**: Accepts objects with `url` and `type` properties
- **Image Labels**: Supports type labels (character, location, style, etc.)

**Request Schema**:
```json
{
  "prompt": "string",
  "images": [
    { "url": "string", "type": "character" },
    { "url": "string", "type": "location" }
  ],
  "max_images": 5,
  "size": "1024*1024",
  "enable_base64_output": false,
  "enable_sync_mode": true
}
```

### Nanobanana
- **Endpoint**: `https://api.wavespeed.ai/api/v3/google/nano-banana/edit`
- **Max Images**: Auto-detected from prompt (no `max_images` parameter)
- **Size Control**: Uses `aspect_ratio` enum ("1:1", "3:2", "16:9", etc.)
- **Image Format**: Accepts string array of URLs only
- **Output Format**: Additional `output_format` parameter ("png" | "jpeg")

**Request Schema**:
```json
{
  "prompt": "string",
  "images": ["url1", "url2", "url3"],
  "aspect_ratio": "1:1",
  "output_format": "png",
  "enable_base64_output": false,
  "enable_sync_mode": true
}
```

## Implementation Changes

### 1. API Endpoint (`route.ts`)

**Provider-Specific Payload Construction**:
```typescript
if (provider === 'nanobanana') {
  apiUrl = 'https://api.wavespeed.ai/api/v3/google/nano-banana/edit';
  requestBody = {
    prompt: prompt.trim(),
    images: imagesPayload.map((img: any) => img.url), // String array
    aspect_ratio: '1:1', // Fixed to square for Stitch
    output_format: 'png',
    enable_base64_output,
    enable_sync_mode,
  };
} else {
  apiUrl = 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit-sequential';
  requestBody = {
    prompt: prompt.trim(),
    images: imagesPayload, // Object array with type labels
    max_images,
    size: finalSize,
    enable_base64_output,
    enable_sync_mode,
  };
}
```

### 2. StitchControlPanel Component

**Conditional UI Elements**:

1. **Max Images Input** - Only shown for Seedream:
```tsx
{provider === 'seedream' && (
  <div className="space-y-2">
    <Label htmlFor="max-images">
      Max Images <span className="text-destructive">*</span>
    </Label>
    <Input type="number" min={1} max={15} value={maxImages} />
  </div>
)}
```

2. **Provider Selection** - Informative labels:
```tsx
<SelectContent>
  <SelectItem value="seedream">Seedream (Recommended)</SelectItem>
  <SelectItem value="nanobanana">Nanobanana (Auto-detect count)</SelectItem>
</SelectContent>
{provider === 'nanobanana' && (
  <p className="text-xs text-muted-foreground">
    ℹ️ Nanobanana automatically determines output count from your prompt
  </p>
)}
```

3. **Cost Calculation** - Estimated for Nanobanana:
```typescript
const totalCost = useMemo(() => {
  const estimatedCount = provider === 'nanobanana'
    ? (promptMaxImages || 1)  // Extract from prompt
    : maxImages;              // Use slider value
  return (estimatedCount * costPerImage).toFixed(3);
}, [maxImages, provider, promptMaxImages]);
```

4. **Validation Messages** - Provider-specific:
```typescript
if (provider === 'seedream') {
  if (promptMaxImages !== null && promptMaxImages !== maxImages) {
    messages.push('⚠️ Prompt mentions X images but max_images is set to Y');
  }
} else if (provider === 'nanobanana') {
  if (promptMaxImages === null) {
    messages.push('💡 Specify how many images you want in your prompt');
  }
}
```

5. **Generate Button** - Dynamic text:
```tsx
{provider === 'nanobanana'
  ? 'Generate Images'
  : `Generate ${maxImages} Image${maxImages !== 1 ? 's' : ''}`
}
```

## User Experience

### Seedream Flow
1. Select "Seedream" provider
2. Add source images (up to 10)
3. Enter prompt
4. Set max_images slider (1-15)
5. Select size (1024-4096)
6. View exact cost: "$0.027 × 5 images"
7. Generate

### Nanobanana Flow
1. Select "Nanobanana" provider
2. Add source images (up to 10)
3. Enter prompt **with image count** (e.g., "Create 5 variations...")
4. Max images input **hidden** (auto-detected)
5. Select size (aspect ratio applied as 1:1)
6. View estimated cost: "$0.027 × 5 images (estimated)"
7. Generate

## Validation Rules

### Seedream
- ✅ Source images: 1-10
- ✅ Prompt: Required
- ✅ Max images: 1-15
- ⚠️ Warning if prompt number ≠ max_images
- ⚠️ Info if max_images > source image count

### Nanobanana
- ✅ Source images: 1-10
- ✅ Prompt: Required
- ✅ Prompt must mention image count
- 💡 Helpful message if no count detected
- ℹ️ Provider info shown

## Cost Estimation

### Seedream
- **Exact**: Uses `max_images` parameter
- **Display**: "$0.027 × 5 images"

### Nanobanana
- **Estimated**: Parses prompt for number (e.g., "5 images" → 5)
- **Fallback**: Defaults to 1 if no number found
- **Display**: "$0.027 × 5 images (estimated)"

## Technical Notes

### Prompt Parsing
Both providers use the same regex to extract image count:
```typescript
const match = prompt.match(/\b(\d+)\s+images?\b/i);
// Matches: "5 images", "create 3 image", "generate 10 images"
```

### Aspect Ratio Mapping
Currently hardcoded to "1:1" for Nanobanana (square):
```typescript
const aspectRatio = '1:1'; // Could be made dynamic in future
```

Future enhancement: Map size selection to appropriate aspect ratios:
- 1024×1024 → "1:1"
- 1024×576 → "16:9"
- 1280×720 → "16:9"
- etc.

### Response Handling
Both providers return images in the same format:
```typescript
// Seedream
if (apiData.code === 200 && apiData.data?.outputs) {
  generatedImages = apiData.data.outputs;
}

// Nanobanana (same format)
if (apiData.code === 200 && apiData.data?.outputs) {
  generatedImages = apiData.data.outputs;
}
```

## Known Limitations

### Nanobanana-Specific
1. **No max_images control** - Must be specified in prompt
2. **Aspect ratio locked** - Currently fixed to 1:1 (square)
3. **Cost estimation** - Less accurate than Seedream (prompt-based)
4. **No progress feedback** - Cannot predict exact output count

### Both Providers
1. **Synchronous only** - May timeout for large requests
2. **No cancellation** - Once started, cannot be stopped
3. **No progress indication** - Binary loading state only

## Testing Checklist

- [x] Seedream: Generate with max_images = 5
- [x] Nanobanana: Generate with "create 5 images" in prompt
- [x] UI: Max images input hidden for Nanobanana
- [x] UI: Cost display shows "(estimated)" for Nanobanana
- [x] UI: Validation messages differ by provider
- [x] API: Correct endpoint used per provider
- [x] API: Request body matches provider schema
- [ ] Runtime: Actual generation with Nanobanana (requires API key)
- [ ] Runtime: Verify output count matches prompt
- [ ] Runtime: Credits deducted correctly

## Future Enhancements

1. **Dynamic Aspect Ratios**: Map size selection to aspect ratio for Nanobanana
2. **Better Count Detection**: Support more prompt formats ("five images", "5x", "quintuple", etc.)
3. **Provider Recommendations**: Auto-suggest provider based on requirements
4. **Cost Comparison**: Show side-by-side cost estimates
5. **Output Format Selection**: Expose PNG/JPEG choice for Nanobanana
6. **Async Mode**: Support asynchronous generation for both providers
7. **Result Comparison**: Side-by-side view of Seedream vs Nanobanana results

## Migration Guide

### Existing Seedream Users
No changes required. Seedream remains the default provider with full feature support.

### New Nanobanana Users
1. Select "Nanobanana" from provider dropdown
2. Include image count in your prompt (e.g., "Create 5 variations...")
3. Cost is estimated based on detected count
4. Max images slider is hidden (not needed)

## API Documentation

### Seedream Edit-Sequential
- Docs: [https://wavespeed.ai/docs/docs-api/bytedance/seedream-v4/edit-sequential](https://wavespeed.ai/docs/docs-api/bytedance/seedream-v4/edit-sequential)
- Pricing: $0.027 per image
- Max Images: 1-15 (user-controlled)

### Nanobanana Edit
- Docs: [https://wavespeed.ai/docs/docs-api/google/nano-banana/edit](https://wavespeed.ai/docs/docs-api/google/nano-banana/edit)
- Pricing: $0.027 per image
- Max Images: Auto-detected from prompt
- Aspect Ratios: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
