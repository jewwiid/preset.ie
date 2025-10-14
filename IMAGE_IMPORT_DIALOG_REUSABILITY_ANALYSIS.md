# Image Import Dialog Reusability Analysis

## Executive Summary

The `StitchImageImportDialog` component is **HIGHLY REUSABLE** across all playground tabs. It's a well-designed, generic image import solution with 4 source options (File Upload, URL, Pexels, Saved Gallery) that can be extracted into a generic component and reused throughout the application.

**Recommendation:** Create `UnifiedImageImportDialog` component that can be used in:
- ✅ **Stitch Tab** (currently using it)
- ✅ **Edit Tab** (replace basic file upload)
- ✅ **Generate Tab** (for img2img/reference images)
- ✅ **Video Tab** (for reference frames/thumbnails)
- ✅ **Batch Tab** (for batch source images)

---

## Current Implementation Analysis

### StitchImageImportDialog Features

**Location:** `/apps/web/app/components/playground/StitchImageImportDialog.tsx` (560 lines)

**4 Import Sources:**
1. **File Upload** - Local file selection with drag-drop area
2. **URL Import** - Paste image URLs with preview validation
3. **Pexels Search** - Integrated stock photo search with filters
4. **Saved Gallery** - User's saved images from playground

**Key Features:**
- ✅ Multi-image selection with configurable limits
- ✅ Image preview thumbnails with error handling
- ✅ Attribution tracking (source, photographer, URL)
- ✅ Responsive grid layout
- ✅ Selection state management (checkboxes, multi-select)
- ✅ Real-time preview validation
- ✅ Loading states for each source
- ✅ Authentication-aware (saved gallery requires login)
- ✅ Toast notifications for user feedback

**Props Interface:**
```typescript
interface StitchImageImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImagesSelected: (images: StitchImage[]) => void;
  maxImages: number;
  currentImageCount: number;
}
```

---

## Current Tab-by-Tab Usage Analysis

### 1. **Stitch Tab** ✅ (Currently Using)

**Current State:** Full implementation of `StitchImageImportDialog`

**Use Case:** Import reference images for Stitch generation (mix multiple images)

**Features Used:**
- Multi-image selection (up to 10 images)
- All 4 sources (File, URL, Pexels, Gallery)
- Attribution tracking
- Image type labeling (face, style, environment, reference, custom)

**Location:** Used via `StitchImageManager` component

---

### 2. **Edit Tab** ⚠️ (Basic File Upload Only)

**Current State:** Basic file input in `AdvancedEditingPanel.tsx`

**Current Implementation:**
```typescript
// Lines 102-108, 110-133
<input
  type="file"
  ref={baseImageInputRef}
  accept="image/*"
  onChange={handleBaseImageUpload}
  className="hidden"
/>
```

**Pain Points:**
- ❌ Only supports local file upload
- ❌ No URL import
- ❌ No Pexels search
- ❌ Can't reuse saved gallery images
- ❌ No multi-image support
- ❌ Basic UI (hidden file input + button)

**Opportunity:**
- **Replace with UnifiedImageImportDialog**
- Allow selecting base image from Pexels/Gallery/URL
- Support reference images from multiple sources
- Improve UX consistency

**Use Cases:**
- Select base image to edit (currently from saved images only)
- Add reference images for style transfer/guided editing
- Import comparison images

---

### 3. **Generate Tab** ⚠️ (No Image Import)

**Current State:** No direct image import UI

**Current Implementation:**
- Only uses `SavedImagesMasonry` for selecting previously generated images
- No way to import external images for img2img

**Pain Points:**
- ❌ Can't import seed images for img2img generation
- ❌ Can't use reference images for style matching
- ❌ Can't import composition guides
- ❌ No Pexels integration for inspiration

**Opportunity:**
- **Add UnifiedImageImportDialog for img2img mode**
- Import reference images for style/composition
- Use Pexels images as generation seeds
- Import brand assets/logos for product shots

**Potential UI Location:**
- Add "Import Reference Image" button in `UnifiedImageGenerationPanel`
- Show imported image thumbnail in generation settings
- Enable img2img mode when reference image added

---

### 4. **Video Tab** ⚠️ (Basic Upload in VideoGenerationPanel)

**Current State:** Basic file upload for reference frames

**Current Implementation:**
```typescript
// In VideoGenerationPanel.tsx
// Uses onImageUpload prop but basic implementation
```

**Pain Points:**
- ❌ Limited to file upload only
- ❌ No multi-frame import
- ❌ Can't use Pexels videos/frames
- ❌ No saved gallery access

**Opportunity:**
- **Add UnifiedImageImportDialog for reference frames**
- Import keyframes from Pexels
- Use saved images as video stills
- Multi-frame import for style consistency

---

### 5. **Batch Tab** ⚠️ (Likely No Import)

**Current State:** Not fully analyzed, but likely minimal import functionality

**Opportunity:**
- **Add UnifiedImageImportDialog for batch source images**
- Import multiple images for batch processing
- Use saved gallery as batch input
- Import from URL list for bulk processing

---

## Proposed Generic Component Design

### Component Name: `UnifiedImageImportDialog`

**Location:** `/apps/web/components/ui/image-import-dialog.tsx`

### Generic Props Interface

```typescript
interface UnifiedImageImportDialogProps {
  // Dialog state
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Selection config
  maxImages: number;
  currentImageCount?: number; // For "X more allowed" messaging
  multiSelect?: boolean; // Default: true

  // Callback with generic format
  onImagesSelected: (images: ImportedImage[]) => void;

  // Feature toggles (customize per use case)
  enableFileUpload?: boolean; // Default: true
  enableUrlImport?: boolean; // Default: true
  enablePexelsSearch?: boolean; // Default: true
  enableSavedGallery?: boolean; // Default: true

  // Customization
  title?: string; // Default: "Import Images"
  description?: string; // Default: auto-generated from maxImages
  acceptedFileTypes?: string; // Default: "image/*"

  // Filtering (for saved gallery)
  galleryFilter?: {
    mediaType?: 'image' | 'video' | 'all'; // Default: 'image'
    tags?: string[];
    dateRange?: { start: Date; end: Date };
  };

  // Image processing
  autoResize?: { maxWidth: number; maxHeight: number };
  quality?: number; // 0-1 for compression
}

interface ImportedImage {
  id: string;
  url: string;
  source: 'upload' | 'url' | 'pexels' | 'saved';
  width?: number;
  height?: number;
  attribution?: {
    source: 'pexels' | 'url' | 'upload' | 'saved';
    photographer?: string;
    photographer_url?: string;
    photographer_id?: number;
    original_url?: string;
  };
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    title?: string;
  };
}
```

---

## Integration Examples

### Example 1: Edit Tab - Base Image Selection

```typescript
// In AdvancedEditingPanel.tsx
import { UnifiedImageImportDialog, ImportedImage } from '@/components/ui/image-import-dialog';

const [showImageImport, setShowImageImport] = useState(false);

<UnifiedImageImportDialog
  open={showImageImport}
  onOpenChange={setShowImageImport}
  maxImages={1}
  multiSelect={false}
  title="Select Base Image"
  description="Choose an image to edit from various sources"
  enableFileUpload={true}
  enableUrlImport={true}
  enablePexelsSearch={true}
  enableSavedGallery={true}
  onImagesSelected={(images) => {
    const image = images[0];
    setUploadedImage(image.url);
    setImageAttribution(image.attribution);
    setShowImageImport(false);
  }}
/>
```

### Example 2: Generate Tab - Reference Image for Img2Img

```typescript
// In UnifiedImageGenerationPanel.tsx
import { UnifiedImageImportDialog, ImportedImage } from '@/components/ui/image-import-dialog';

const [referenceImages, setReferenceImages] = useState<ImportedImage[]>([]);
const [showImageImport, setShowImageImport] = useState(false);

<UnifiedImageImportDialog
  open={showImageImport}
  onOpenChange={setShowImageImport}
  maxImages={3}
  multiSelect={true}
  title="Add Reference Images"
  description="Import images for style reference or img2img generation"
  enableFileUpload={true}
  enableUrlImport={true}
  enablePexelsSearch={true}
  enableSavedGallery={true}
  onImagesSelected={(images) => {
    setReferenceImages([...referenceImages, ...images]);
    setShowImageImport(false);
    // Auto-enable img2img mode
    onGenerationModeChange('image-to-image');
  }}
/>
```

### Example 3: Video Tab - Multi-Frame Import

```typescript
// In VideoGenerationPanel.tsx
import { UnifiedImageImportDialog, ImportedImage } from '@/components/ui/image-import-dialog';

const [keyframes, setKeyframes] = useState<ImportedImage[]>([]);

<UnifiedImageImportDialog
  open={showFrameImport}
  onOpenChange={setShowFrameImport}
  maxImages={10}
  multiSelect={true}
  title="Import Keyframes"
  description="Add keyframes to guide video generation"
  enableFileUpload={true}
  enableUrlImport={false} // Disable for video use case
  enablePexelsSearch={true} // Find video stills
  enableSavedGallery={true}
  galleryFilter={{ mediaType: 'image' }} // Only images, not videos
  onImagesSelected={(images) => {
    setKeyframes([...keyframes, ...images]);
    setShowFrameImport(false);
  }}
/>
```

### Example 4: Stitch Tab - Maintain Current Behavior

```typescript
// In StitchTab.tsx (minimal changes)
import { UnifiedImageImportDialog, ImportedImage } from '@/components/ui/image-import-dialog';

// Convert ImportedImage to StitchImage format
const handleImagesSelected = (images: ImportedImage[]) => {
  const stitchImages: StitchImage[] = images.map(img => ({
    id: img.id,
    url: img.url,
    type: 'reference', // Default type
    attribution: img.attribution,
  }));
  setSourceImages([...sourceImages, ...stitchImages]);
};

<UnifiedImageImportDialog
  open={showImageImport}
  onOpenChange={setShowImageImport}
  maxImages={10}
  currentImageCount={sourceImages.length}
  multiSelect={true}
  enableFileUpload={true}
  enableUrlImport={true}
  enablePexelsSearch={true}
  enableSavedGallery={true}
  onImagesSelected={handleImagesSelected}
/>
```

---

## Migration Strategy

### Phase 1: Extract Generic Component (2-3 hours)

1. **Create** `/apps/web/components/ui/image-import-dialog.tsx`
2. **Copy** logic from `StitchImageImportDialog.tsx`
3. **Generalize** props and interfaces
4. **Add** feature toggle props
5. **Extract** Pexels logic to separate hook (already exists: `usePexelsSearch`)
6. **Test** with Stitch tab to ensure backward compatibility

### Phase 2: Integrate into Edit Tab (1-2 hours)

1. **Replace** basic file input in `AdvancedEditingPanel.tsx`
2. **Add** "Import Base Image" button
3. **Update** reference image selection to use dialog
4. **Test** all edit operations with new import sources

### Phase 3: Add to Generate Tab (2-3 hours)

1. **Add** "Add Reference Image" button to `UnifiedImageGenerationPanel.tsx`
2. **Create** reference image preview section
3. **Enable** img2img mode when reference added
4. **Update** generation API to accept reference images
5. **Test** img2img generation with Pexels/Gallery images

### Phase 4: Enhance Video Tab (1-2 hours)

1. **Replace** basic upload in `VideoGenerationPanel.tsx`
2. **Add** keyframe management UI
3. **Test** multi-frame import

### Phase 5: Enhance Batch Tab (1-2 hours)

1. **Add** batch image import
2. **Enable** bulk selection from gallery
3. **Test** batch processing

### Phase 6: Deprecate StitchImageImportDialog (30 min)

1. **Update** `StitchImageManager.tsx` to use `UnifiedImageImportDialog`
2. **Delete** `StitchImageImportDialog.tsx`
3. **Update** documentation

---

## Benefits of Reusability

### Code Reduction
- **Before:** 560 lines × 5 tabs = ~2,800 lines (if reimplemented)
- **After:** 600 lines (generic) + 50 lines per integration = 850 lines
- **Savings:** ~2,000 lines (70% reduction)

### Consistency
- ✅ Same UX across all tabs
- ✅ Consistent attribution tracking
- ✅ Unified Pexels integration
- ✅ Shared gallery access

### Maintainability
- ✅ Single source of truth for image import logic
- ✅ Bug fixes apply to all tabs
- ✅ Feature additions benefit entire app
- ✅ Easier to test

### User Experience
- ✅ Familiar import flow across playground
- ✅ Access to all image sources everywhere
- ✅ Better mobile responsiveness
- ✅ Professional polish

---

## Technical Considerations

### Dependencies

**Current:**
- `usePexelsSearch` hook ✅ (already extracted)
- `PexelsSearchPanel` component ✅ (already exists)
- Gallery API endpoint ✅ (`/api/playground/gallery`)
- Auth context ✅ (`useAuth`)

**New:**
- Image validation utility (check dimensions, file size)
- Image optimization utility (resize, compress)
- URL preview service (validate image URLs)

### Breaking Changes

**None** - The generic component is fully backward compatible:
- Stitch tab can continue using current interface
- Other tabs gain new functionality
- Gradual migration possible

### Performance

**Optimizations:**
- Lazy load Pexels results
- Virtual scrolling for large galleries
- Image thumbnail caching
- Debounced search queries

---

## Recommendation: GO FOR IT! ✅

**Priority:** HIGH

**Effort:** 8-12 hours total

**Impact:** Massive UX improvement + 2,000 lines saved

**Risk:** Low (backward compatible, well-scoped)

**Next Steps:**
1. Start with Phase 1 (extract generic component)
2. Test with Stitch tab
3. Integrate into Edit tab (quick win)
4. Roll out to other tabs progressively

---

## Summary

The `StitchImageImportDialog` is a **goldmine of reusability**. It's well-architected, feature-complete, and can be generalized with minimal effort to serve all playground tabs. This consolidation will:

1. **Reduce code duplication** by ~70%
2. **Improve UX consistency** across the app
3. **Enable new features** (Pexels in Edit tab, img2img in Generate tab)
4. **Simplify maintenance** (single source of truth)
5. **Speed up development** (reuse for future features)

**This is exactly the type of refactoring the codebase needs.** It aligns perfectly with the goal of making components more reusable and the codebase easier to maintain.
