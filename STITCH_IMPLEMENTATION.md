# Stitch Feature Implementation

## Overview
The Stitch feature allows users to generate images from multiple reference images using the Seedream API's edit-sequential endpoint. Users can upload up to 10 source images, label them with types (character, location, style, object, reference, custom), and generate up to 15 output images based on a prompt.

## Components Created

### 1. **StitchImageManager** (`/app/components/playground/StitchImageManager.tsx`)
**Purpose**: Manages source image upload, labeling, and reordering

**Features**:
- Multi-image upload (file picker)
- Image URL input support
- Drag-to-reorder functionality with visual feedback
- Image type labeling (character, location, style, object, reference, custom)
- Custom label input for "custom" type
- Thumbnail preview with active selection
- Remove individual images
- Visual indicators (type badges with color coding)
- Maximum 10 images enforced

**Key Interface**:
```typescript
interface StitchImage {
  id: string;
  url: string;
  type: 'character' | 'location' | 'style' | 'object' | 'reference' | 'custom';
  customLabel?: string;
}
```

### 2. **StitchControlPanel** (`/app/components/playground/StitchControlPanel.tsx`)
**Purpose**: Generation settings and validation

**Features**:
- Prompt textarea with helpful tips
- Provider selection (Seedream/Nanobanana)
- Max images input (1-15) with validation
- Size selection (1024×1024 to 4096×4096)
- Real-time cost calculation ($0.027 per image)
- Prompt parsing to detect mentioned image count
- Validation warnings:
  - No source images
  - Empty prompt
  - Mismatch between prompt and max_images
  - Insufficient credits
- Generate button with loading state
- Credits display

**Key Validation**:
- Extracts number from prompt (e.g., "Create 5 images...") and warns if it doesn't match max_images setting
- Blocks generation if validation fails

### 3. **StitchPreviewArea** (`/app/components/playground/StitchPreviewArea.tsx`)
**Purpose**: Display and manage generated images

**Features**:
- Loading state with spinner
- Empty state messaging
- Main image preview (large view)
- Thumbnail grid with hover actions
- Individual image download
- Individual image save to gallery
- Bulk download all
- Bulk save all
- Active selection highlighting
- Index badges on thumbnails

### 4. **StitchTab** (`/app/components/playground/tabs/StitchTab.tsx`)
**Purpose**: Main tab orchestrator

**Features**:
- Two-column layout (source/controls left, output right)
- Manages all component state
- Handles API integration
- Transforms image data for API payload
- Error handling and user feedback
- Integrates with parent's save-to-gallery functionality

**Layout**:
```
┌─────────────────────────┬─────────────────────────┐
│  StitchImageManager     │  StitchPreviewArea      │
│  (Upload & Label)       │  (Generated Output)     │
│                         │                         │
│  StitchControlPanel     │  (Sticky on desktop)    │
│  (Settings & Generate)  │                         │
└─────────────────────────┴─────────────────────────┘
```

## API Endpoint

### **POST /api/v3/bytedance/seedream-v4/edit-sequential**
**File**: `/app/api/v3/bytedance/seedream-v4/edit-sequential/route.ts`

**Features**:
- User authentication via `getUserFromRequest`
- Input validation (prompt, images, max_images, size)
- Credits checking and deduction ($0.027 per image)
- Provider selection (Seedream/Nanobanana)
- Resolution normalization (converts single number to "width*height" format)
- Wavespeed API integration
- Project record creation
- Comprehensive error handling

**Request Body**:
```typescript
{
  prompt: string;              // Required, non-empty
  images: Array<{              // Required, 1-10 images
    url: string;
    type?: string;             // character, location, style, etc.
  }>;
  max_images: number;          // Required, 1-15
  size: string | number;       // 1024, 1280, 1536, 2048, 3072, 4096
  provider?: string;           // 'seedream' | 'nanobanana'
  enable_base64_output?: boolean;
  enable_sync_mode?: boolean;
}
```

**Response**:
```typescript
{
  success: boolean;
  images: string[];            // Array of generated image URLs
  project?: object;            // Saved project data
  creditsUsed: number;
  metadata: {
    prompt: string;
    max_images: number;
    size: string;
    provider: string;
    source_images_count: number;
  };
}
```

**Error Responses**:
- 401: Unauthorized (no user session)
- 400: Validation errors (missing prompt, invalid images, bad max_images)
- 403: Insufficient credits
- 500: API failure, database errors

## Integration with TabbedPlaygroundLayout

**Changes Made**:
1. Added `Scissors` icon import
2. Added `StitchTab` import
3. Added tab trigger in TabsList
4. Added TabsContent section with StitchTab
5. Passed props: `loading`, `userCredits`, `userSubscriptionTier`, `onSaveToGallery`

**Tab Trigger**:
```tsx
<TabsTrigger value="stitch" className="flex items-center gap-2.5 px-6 py-3">
  <Scissors className="h-4 w-4 flex-shrink-0" />
  <span>Stitch</span>
</TabsTrigger>
```

## User Flow

1. **Navigate to Stitch Tab**: Click "Stitch" tab in playground
2. **Upload Images**:
   - Click upload area or drag files
   - Or paste image URLs
   - Add up to 10 images
3. **Label Images**: Select type for each image (character, location, style, etc.)
4. **Reorder Images**: Drag thumbnails to change sequence order
5. **Configure Settings**:
   - Enter prompt describing desired output
   - Select provider (Seedream/Nanobanana)
   - Set max_images (1-15)
   - Choose output size (1024-4096)
6. **Review Cost**: Check estimated cost display
7. **Generate**: Click "Generate" button
8. **View Results**: Generated images appear in right column
9. **Manage Output**:
   - Click thumbnails to preview
   - Download individual or all images
   - Save to gallery individual or all images

## Pricing

- **Cost**: $0.027 per generated image
- **Example**: Generating 5 images = $0.135
- Credits are deducted from user's account upon successful generation

## Validation Rules

1. **Source Images**: Must have at least 1, maximum 10
2. **Prompt**: Required, non-empty string
3. **Max Images**: Must be between 1-15
4. **Prompt Alignment**: Warning shown if prompt mentions different number than max_images setting
5. **Credits**: User must have sufficient credits before generation

## Technical Notes

### State Management
- Source images managed locally in StitchTab
- Image selection (both source and generated) tracked independently
- Generation loading state separate from parent loading state
- Save-to-gallery state tracked per image URL

### Image Handling
- Uploaded files converted to Object URLs for preview
- URL-added images used directly
- Image type labels sent to API for better results
- Custom labels supported for flexible categorization

### API Integration
- Uses existing Wavespeed API proxy
- Supports both Seedream and Nanobanana providers
- Synchronous mode enabled by default
- Base64 output disabled (uses URLs)
- Resolution normalized to "width*height" format

### Database
- Projects saved with type 'stitch'
- Credits tracked in user_credits table
- Generated images stored with metadata (sequence_index, source_images)

## Testing

**Build Status**: ✅ Successful
- All components compile without errors
- TypeScript types validated
- Next.js build completed successfully
- No runtime errors detected

**Tested Scenarios**:
- [x] Component creation and import
- [x] TypeScript compilation
- [x] API endpoint structure
- [x] Integration with main playground layout
- [ ] End-to-end generation flow (requires runtime testing)
- [ ] Credit deduction verification
- [ ] Image upload and labeling
- [ ] Provider switching

## Files Created/Modified

### Created (8 files):
1. `/app/components/playground/StitchImageManager.tsx` (360 lines)
2. `/app/components/playground/StitchControlPanel.tsx` (255 lines)
3. `/app/components/playground/StitchPreviewArea.tsx` (165 lines)
4. `/app/components/playground/tabs/StitchTab.tsx` (172 lines)
5. `/app/api/v3/bytedance/seedream-v4/edit-sequential/route.ts` (215 lines)
6. `/STITCH_IMPLEMENTATION.md` (this file)

### Modified (1 file):
1. `/app/components/playground/TabbedPlaygroundLayout.tsx`:
   - Added Scissors icon import
   - Added StitchTab import
   - Added tab trigger
   - Added TabsContent section
   - Added onSaveToGallery prop passing

## Next Steps (Production)

1. **Runtime Testing**:
   - Test image upload functionality
   - Verify drag-and-drop reordering
   - Test label assignment and custom labels
   - Verify API integration with Wavespeed
   - Test credit deduction
   - Verify save-to-gallery integration

2. **User Experience**:
   - Add image preview on hover
   - Add progress indicator during generation
   - Add retry mechanism on failure
   - Add generation history within tab
   - Add preset prompt templates

3. **Performance**:
   - Optimize image preview rendering
   - Add lazy loading for thumbnails
   - Implement request debouncing
   - Add request cancellation

4. **Documentation**:
   - Add user guide/tutorial
   - Add tooltip hints
   - Create video demo
   - Update help documentation

5. **Monitoring**:
   - Add analytics tracking
   - Monitor API success rates
   - Track average generation times
   - Monitor credit usage patterns

## Known Limitations

1. Maximum 10 source images (API limitation)
2. Maximum 15 generated images (API limitation)
3. Synchronous generation only (may timeout for large requests)
4. No progress indication during generation
5. No ability to cancel in-progress generation
6. Uploaded images stored as Object URLs (not persisted)
7. No batch save-to-gallery with custom titles

## Future Enhancements

1. **Image Management**:
   - Persist uploaded images to storage
   - Support image editing before generation
   - Add image quality validation
   - Support multiple image sources (gallery, URL, camera)

2. **Generation Options**:
   - Add style presets
   - Support negative prompts
   - Add seed control for reproducibility
   - Support image weights/priorities

3. **Output Management**:
   - Add comparison view
   - Support variations from single output
   - Add image editing post-generation
   - Export as collection/project

4. **Collaboration**:
   - Share source image collections
   - Share generation settings
   - Collaborative labeling
   - Community templates

## API Documentation Reference

**Seedream Edit-Sequential API**:
- Endpoint: `https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit-sequential`
- Method: POST
- Pricing: $0.027 per image
- Max Images: 1-15
- Sizes: 1024×1024 to 4096×4096

**Response Format**:
```json
{
  "code": 200,
  "data": {
    "outputs": ["https://...", "https://...", ...]
  },
  "message": "Success"
}
```
