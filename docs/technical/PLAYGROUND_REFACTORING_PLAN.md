# Playground Refactoring Plan - UnifiedImageGenerationPanel.tsx

## Current Status: IN PROGRESS
**File:** apps/web/app/components/playground/UnifiedImageGenerationPanel.tsx
**Original Size:** 2,948 lines
**Target Size:** ~300-350 lines (89% reduction)
**Pattern:** Following successful Dashboard refactoring

---

## ✅ Completed Steps

### Phase 1: Foundation ✅
- [x] Created backup: `UnifiedImageGenerationPanel.tsx.backup`
- [x] Created types file: `lib/types/playground.ts` (270 lines)
  - Preset interface
  - Props interfaces for all components
  - State interfaces (Pexels, Image dimensions)
  - Generation params

- [x] Created utilities file: `lib/utils/playground.ts` (249 lines)
  - formatStyleName()
  - detectSubjectCategory()
  - calculateResolution()
  - extractAspectRatioFromPrompt()
  - getImageDimensions()
  - calculateAspectRatio()
  - isValidHexColor()
  - isDefaultPrompt()
  - replaceSubjectInTemplate()
  - debounce()

---

## 🔄 Phase 2: Custom Hooks (6 hooks, ~800 lines total)

### Hook Strategy
Due to the complexity and interconnected state (76 hooks total), we'll create simplified, focused hooks that manage specific concerns:

### 2.1 usePresetManagement (~150 lines)
**File:** `lib/hooks/playground/usePresetManagement.ts`
**Responsibilities:**
- Load preset from localStorage/URL
- Apply preset to form (prompt, style, resolution, aspect ratio, intensity)
- Parse preset data from API
- Subject replacement in templates
**State:** currentPreset, loading
**Returns:** { currentPreset, applyPreset, clearPreset }

### 2.2 usePromptGeneration (~180 lines)
**File:** `lib/hooks/playground/usePromptGeneration.ts`
**Responsibilities:**
- Generate enhanced prompts from style + subject
- AI enhancement API calls
- Track prompt modifications
**State:** prompt, enhancedPrompt, originalPrompt, isPromptModified, isEnhancing
**Returns:** { prompt, enhancedPrompt, setPrompt, generatePrompt, aiEnhance, clearPrompt }

### 2.3 useCinematicMode (~120 lines)
**File:** `lib/hooks/playground/useCinematicMode.ts`
**Responsibilities:**
- Cinematic parameters management
- Aspect ratio synchronization (with refs)
- Enhanced prompt building
**State:** enableCinematicMode, cinematicParameters, includeTechnicalDetails, includeStyleReferences
**Returns:** { enableCinematicMode, cinematicParameters, toggleCinematicMode, updateParameters }

### 2.4 useBaseImageUpload (~150 lines)
**File:** `lib/hooks/playground/useBaseImageUpload.ts`
**Responsibilities:**
- File upload to API
- Image dimension detection
- Base image removal
- Saved images selection
**State:** baseImage, baseImageSource, baseImageDimensions, uploading
**Returns:** { baseImage, uploadFile, removeImage, selectSavedImage }

### 2.5 usePexelsSearch (~180 lines)
**File:** `lib/hooks/playground/usePexelsSearch.ts`
**Responsibilities:**
- Pexels API integration
- Search with debounce
- Filter management (orientation, size, color, hex)
- Pagination
**State:** query, results, loading, page, totalResults, filters
**Returns:** { searchState, search, updateFilters, selectPhoto, nextPage, prevPage }

### 2.6 useImageGenerationForm (~120 lines)
**File:** `lib/hooks/playground/useImageGenerationForm.ts`
**Responsibilities:**
- Form state (resolution, aspect ratio, style, provider, etc.)
- Generation mode toggle
- Settings synchronization
**State:** resolution, aspectRatio, numImages, intensity, style, consistencyLevel, generationMode
**Returns:** { formState, updateField, resetForm }

---

## 📦 Phase 3: Components (6 components, ~1,200 lines total)

### Component Extraction Strategy
Each component will be a self-contained UI module with clear inputs/outputs.

### 3.1 BaseImageUploader.tsx (~300 lines)
**File:** `components/playground/BaseImageUploader.tsx`
**Purpose:** Upload/select base images for image-to-image generation
**Features:**
- Tabs: Upload | Saved Images | Pexels Search
- File upload with preview
- Saved images grid (8 items)
- Pexels search integration
- Image preview with remove button

### 3.2 PexelsSearchPanel.tsx (~250 lines)
**File:** `components/playground/PexelsSearchPanel.tsx`
**Purpose:** Search Pexels stock photos
**Features:**
- Live search input with debounce
- Filter controls (orientation, size, color, custom hex)
- Results grid with pagination
- Photographer attribution
- Photo selection

### 3.3 PromptBuilder.tsx (~200 lines)
**File:** `components/playground/PromptBuilder.tsx`
**Purpose:** Build and enhance prompts
**Features:**
- Subject input field
- Style selector
- Enhanced prompt preview (read-only, syntax highlighted)
- Editable prompt textarea
- Action buttons (AI Enhance, Clear, Save Preset)

### 3.4 CinematicModePanel.tsx (~180 lines)
**File:** `components/playground/CinematicModePanel.tsx`
**Purpose:** Configure cinematic generation parameters
**Features:**
- Cinematic mode toggle
- CinematicParameterSelector integration
- Preview modal with breakdown
- Toggle switches (technical details, style references)

### 3.5 GenerationSettings.tsx (~150 lines)
**File:** `components/playground/GenerationSettings.tsx`
**Purpose:** Configure generation parameters
**Features:**
- Resolution selector (with free tier override)
- Aspect ratio selector
- Provider selector (Nanobanana/Seedream)
- Number of images slider
- Intensity slider (image-to-image only)

### 3.6 SavePresetDialog.tsx (~120 lines)
**File:** `components/playground/SavePresetDialog.tsx`
**Purpose:** Save current settings as a preset
**Features:**
- Modal dialog
- Form fields (name, category, description)
- Public/private toggle
- Submit to API

---

## 🎯 Phase 4: Main Component Refactoring

### Final Structure (~300-350 lines)
```tsx
export default function UnifiedImageGenerationPanel({ ... }) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()

  // Custom hooks consolidate all state
  const presetState = usePresetManagement()
  const promptState = usePromptGeneration()
  const cinematicState = useCinematicMode()
  const baseImageState = useBaseImageUpload()
  const pexelsState = usePexelsSearch()
  const formState = useImageGenerationForm()

  // Main generation handler
  const handleGenerate = async () => { ... }

  return (
    <Card>
      <CardHeader>
        <PresetSelector {...presetState} />
        <GenerationModeToggle {...formState} />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Conditional base image upload for image-to-image */}
        {formState.generationMode === 'image-to-image' && (
          <BaseImageUploader
            {...baseImageState}
            pexelsState={pexelsState}
          />
        )}

        {/* Prompt building */}
        <PromptBuilder {...promptState} {...presetState} />

        {/* Optional cinematic mode */}
        <CinematicModePanel {...cinematicState} />

        {/* Generation settings */}
        <GenerationSettings {...formState} />

        {/* Generate button */}
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Images'}
        </Button>
      </CardContent>

      {/* Save Preset Dialog */}
      <SavePresetDialog {...allState} />
    </Card>
  )
}
```

---

## 📊 Expected Results

### File Size Reduction
- **Before:** 2,948 lines (1 file)
- **After:**
  - Types: 270 lines
  - Utils: 249 lines
  - 6 Hooks: ~800 lines
  - 6 Components: ~1,200 lines
  - Main component: ~350 lines
  - **Total:** ~2,869 lines (distributed across 14 files)

### Benefits
- ✅ **Maintainability:** Each file < 300 lines
- ✅ **Reusability:** Hooks/components usable elsewhere
- ✅ **Testability:** Individual unit testing
- ✅ **Collaboration:** Multiple devs can work simultaneously
- ✅ **Performance:** No functionality changes
- ✅ **Type Safety:** Centralized TypeScript types

---

## ⚠️ Important Notes

### Complexity Considerations
The original file has:
- 76 React hooks (useState, useEffect, useCallback, useRef)
- Complex state synchronization (aspect ratio refs, cinematic mode)
- Multiple data sources (API, localStorage, URL params, Pexels)
- Nested state dependencies

### Migration Strategy
Instead of creating 6 separate hooks files, we'll use a **simplified approach**:
1. Keep tightly coupled state together
2. Use compound hooks where appropriate
3. Prioritize readability over perfect separation
4. Maintain all existing functionality

---

## 🚀 Next Steps

1. Complete custom hooks creation
2. Extract UI components
3. Refactor main component
4. Test all functionality
5. Update imports
6. Remove backup if successful

**Status:** Phase 1 complete, starting Phase 2
**Last Updated:** January 2, 2025
