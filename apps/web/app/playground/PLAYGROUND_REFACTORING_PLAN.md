# Playground Page Refactoring Plan

## Current State
- **File**: `app/playground/page.tsx`
- **Line Count**: 1,313 lines
- **State Complexity**: 18 useState/useEffect calls
- **Status**: 🟡 HIGH PRIORITY - Needs refactoring
- **Impact**: High (core creative tool, high user engagement)
- **Note**: Already uses some sub-components (good foundation!)

## Current Component Architecture
✅ Already extracted:
- `TabbedPlaygroundLayout`
- `AdvancedEditingPanel`
- `SequentialGenerationPanel`
- `StyleVariationsPanel`
- `BatchProcessingPanel`
- `VideoGenerationPanel`
- `ImageGalleryPanel`
- `PastGenerationsPanel`
- `EnhancedPlaygroundHeader`
- `BatchProgressTracker`

## Problems Identified
1. **Orchestration Complexity**: Main file still coordinates too much
2. **State Management**: 18+ state variables in main component
3. **Project Management**: Loading, saving, updating mixed in
4. **Credit System**: Credit checks scattered throughout
5. **Multiple Generation Modes**: Image, video, batch all in one place
6. **URL Parameter Handling**: Preset loading logic inline
7. **Toast Management**: Notification logic mixed with business logic

## Proposed Structure

```
app/playground/
├── page.tsx (main orchestrator, ~200 lines)
│
├── types.ts (~100 lines)
│   - PlaygroundProject
│   - GenerationMode
│   - GenerationParams
│   - ProjectStatus
│
├── hooks/
│   ├── usePlaygroundProject.ts (~180 lines)
│   │   - Load/save projects
│   │   - Project state management
│   │   - History management
│   │
│   ├── useImageGeneration.ts (~200 lines)
│   │   - Image generation logic
│   │   - Multiple image handling
│   │   - Generation parameters
│   │
│   ├── useVideoGeneration.ts (~150 lines)
│   │   - Video generation logic
│   │   - Status polling
│   │   - Video metadata
│   │
│   ├── useBatchGeneration.ts (~180 lines)
│   │   - Batch processing
│   │   - Queue management
│   │   - Progress tracking
│   │
│   ├── usePresetIntegration.ts (~120 lines)
│   │   - Load preset from URL
│   │   - Apply preset settings
│   │   - Preset compatibility
│   │
│   ├── useCreditsManagement.ts (~100 lines)
│   │   - Fetch user credits
│   │   - Calculate costs
│   │   - Subscription tier checks
│   │
│   └── useSavedImages.ts (~100 lines)
│       - Save/unsave images
│       - Fetch saved images
│       - Collection management
│
├── components/
│   ├── PlaygroundWorkspace.tsx (~200 lines)
│   │   - Main workspace layout
│   │   - Tab management
│   │   - Panel coordination
│   │
│   ├── GenerationControls.tsx (~180 lines)
│   │   - Common generation controls
│   │   - Mode selector
│   │   - Quick actions
│   │
│   ├── ProjectHeader.tsx (~120 lines)
│   │   - Project info display
│   │   - Save/load buttons
│   │   - Credits display
│   │
│   ├── ImageGenerationTab.tsx (~150 lines)
│   │   - Image generation UI
│   │   - Parameters panel
│   │   - Results display
│   │
│   ├── VideoGenerationTab.tsx (~120 lines)
│   │   - Video generation UI
│   │   - Video-specific controls
│   │   - Video player
│   │
│   ├── BatchGenerationTab.tsx (~150 lines)
│   │   - Batch processing UI
│   │   - Queue display
│   │   - Batch controls
│   │
│   ├── ResultsGallery.tsx (~180 lines)
│   │   - Generated images/videos
│   │   - Selection handling
│   │   - Download/save actions
│   │
│   ├── CreditsWidget.tsx (~80 lines)
│   │   - Credits display
│   │   - Usage tracking
│   │   - Upgrade prompt
│   │
│   └── PresetBanner.tsx (~60 lines)
│       - Active preset indicator
│       - Preset info
│       - Clear preset button
│
├── lib/
│   ├── playgroundHelpers.ts (~120 lines)
│   │   - Format generation params
│   │   - Calculate costs
│   │   - Validate inputs
│   │
│   ├── generationApi.ts (~150 lines)
│   │   - API client for generation
│   │   - Request formatting
│   │   - Response handling
│   │
│   └── projectStorage.ts (~100 lines)
│       - Save project to DB
│       - Load project from DB
│       - Project serialization
│
└── constants/
    └── playgroundConfig.ts (~80 lines)
        - Generation modes
        - Default parameters
        - Cost configurations
        - API endpoints
```

## Files to Create

### Phase 1: Extract Types and Constants

#### 1. `playground/types.ts`
**Lines**: ~100
**Exports**: TypeScript interfaces
```typescript
- PlaygroundProject
- GenerationMode ('image' | 'video' | 'batch')
- GenerationParams
- GenerationResult
- ProjectStatus
- VideoGenerationMetadata
```

#### 2. `playground/constants/playgroundConfig.ts`
**Lines**: ~80
**Exports**: Configuration constants
```typescript
- GENERATION_MODES
- DEFAULT_PARAMS
- COST_PER_GENERATION
- SUBSCRIPTION_LIMITS
```

### Phase 2: Extract Business Logic

#### 3. `playground/lib/playgroundHelpers.ts`
**Lines**: ~120
**Exports**: Helper functions
```typescript
{
  formatGenerationParams: (params: GenerationParams) => APIParams
  calculateGenerationCost: (mode: Mode, params: Params) => number
  validateGenerationParams: (params: Params) => ValidationResult
  canGenerate: (credits: number, cost: number) => boolean
}
```

#### 4. `playground/lib/generationApi.ts`
**Lines**: ~150
**Exports**: API client
```typescript
{
  generateImage: (params: ImageParams) => Promise<ImageResult>
  generateVideo: (params: VideoParams) => Promise<VideoTask>
  pollVideoStatus: (taskId: string) => Promise<VideoStatus>
  batchGenerate: (items: BatchItem[]) => Promise<BatchResult>
}
```

#### 5. `playground/lib/projectStorage.ts`
**Lines**: ~100
**Exports**: Project persistence
```typescript
{
  saveProject: (project: PlaygroundProject) => Promise<string>
  loadProject: (id: string) => Promise<PlaygroundProject>
  loadRecentProjects: () => Promise<PlaygroundProject[]>
  deleteProject: (id: string) => Promise<void>
}
```

### Phase 3: Extract Hooks

#### 6. `playground/hooks/usePlaygroundProject.ts`
**Lines**: ~180
**Purpose**: Project management
**Returns**:
```typescript
{
  currentProject: PlaygroundProject | null
  loading: boolean
  saveProject: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createNewProject: () => void
  updateProject: (updates: Partial<PlaygroundProject>) => void
  isDirty: boolean
}
```

#### 7. `playground/hooks/useImageGeneration.ts`
**Lines**: ~200
**Purpose**: Image generation
**Returns**:
```typescript
{
  generating: boolean
  images: string[]
  params: ImageGenerationParams
  setParams: (p: Partial<ImageGenerationParams>) => void
  generate: () => Promise<void>
  selectImage: (url: string) => void
  selectedImage: string | null
}
```

#### 8. `playground/hooks/useVideoGeneration.ts`
**Lines**: ~150
**Purpose**: Video generation
**Returns**:
```typescript
{
  generating: boolean
  videoUrl: string | null
  videoMetadata: VideoMetadata | null
  params: VideoGenerationParams
  setParams: (p: Partial<VideoGenerationParams>) => void
  generate: () => Promise<void>
  status: 'idle' | 'generating' | 'completed'
}
```

#### 9. `playground/hooks/useBatchGeneration.ts`
**Lines**: ~180
**Purpose**: Batch processing
**Returns**:
```typescript
{
  queue: BatchItem[]
  processing: boolean
  progress: { current: number, total: number }
  addToQueue: (items: BatchItem[]) => void
  startBatch: () => Promise<void>
  cancelBatch: () => void
  results: BatchResult[]
}
```

#### 10. `playground/hooks/usePresetIntegration.ts`
**Lines**: ~120
**Purpose**: Preset loading from URL
**Returns**:
```typescript
{
  activePreset: Preset | null
  loading: boolean
  loadPresetFromUrl: () => Promise<void>
  applyPreset: (preset: Preset) => void
  clearPreset: () => void
}
```

#### 11. `playground/hooks/useCreditsManagement.ts`
**Lines**: ~100
**Purpose**: Credits system
**Returns**:
```typescript
{
  credits: number
  subscriptionTier: string
  loading: boolean
  calculateCost: (mode: Mode, params: Params) => number
  canAfford: (cost: number) => boolean
  deductCredits: (amount: number) => Promise<void>
  refetch: () => Promise<void>
}
```

#### 12. `playground/hooks/useSavedImages.ts`
**Lines**: ~100
**Purpose**: Saved images management
**Returns**:
```typescript
{
  saving: boolean
  saveImage: (url: string, metadata?: any) => Promise<void>
  unsaveImage: (url: string) => Promise<void>
  isSaved: (url: string) => boolean
  savedImages: SavedImage[]
}
```

### Phase 4: Extract UI Components

#### 13. `playground/components/PlaygroundWorkspace.tsx`
**Lines**: ~200
**Props**: `{ activeTab, onTabChange, children }`
**Purpose**: Main layout wrapper

#### 14. `playground/components/GenerationControls.tsx`
**Lines**: ~180
**Props**: `{ mode, params, onGenerate, generating, credits }`
**Purpose**: Shared generation controls

#### 15. `playground/components/ProjectHeader.tsx`
**Lines**: ~120
**Props**: `{ project, onSave, onLoad, credits, saving }`
**Purpose**: Project info and actions

#### 16. `playground/components/ImageGenerationTab.tsx`
**Lines**: ~150
**Props**: `{ params, setParams, onGenerate, results, loading }`
**Purpose**: Image generation interface

#### 17. `playground/components/VideoGenerationTab.tsx`
**Lines**: ~120
**Props**: `{ params, setParams, onGenerate, result, loading }`
**Purpose**: Video generation interface

#### 18. `playground/components/BatchGenerationTab.tsx`
**Lines**: ~150
**Props**: `{ queue, progress, onStart, onCancel, results }`
**Purpose**: Batch processing interface

#### 19. `playground/components/ResultsGallery.tsx`
**Lines**: ~180
**Props**: `{ images, videos, onSelect, onSave, onDownload }`
**Purpose**: Display generated results

#### 20. `playground/components/CreditsWidget.tsx`
**Lines**: ~80
**Props**: `{ credits, tier, cost }`
**Purpose**: Credits display and info

#### 21. `playground/components/PresetBanner.tsx`
**Lines**: ~60
**Props**: `{ preset, onClear }`
**Purpose**: Show active preset

### Phase 5: Refactor Main Page

#### 22. `playground/page.tsx`
**Lines**: ~200 (from 1,313!)
**Purpose**: Main orchestrator coordinating all hooks and components

## Migration Strategy

### Phase 1: Extract Types and Constants (1-2 hours)
1. ✅ Create `types.ts`
2. ✅ Create `constants/playgroundConfig.ts`

### Phase 2: Extract Business Logic (3-4 hours)
1. Create helper functions
2. Create API client
3. Create project storage
4. Unit test all functions

### Phase 3: Extract Hooks (6-8 hours)
1. Create project management hook
2. Create image generation hook
3. Create video generation hook
4. Create batch generation hook
5. Create preset integration hook
6. Create credits management hook
7. Create saved images hook
8. Test each hook

### Phase 4: Extract New Components (4-5 hours)
Note: Many components already exist, only create missing ones
1. Create workspace layout
2. Create generation controls
3. Create project header
4. Create credits widget
5. Create preset banner
6. Test components

### Phase 5: Refactor Main Page (2-3 hours)
1. Update page to use all hooks
2. Update component structure
3. Remove old code
4. Integration testing

### Phase 6: Testing & Polish (2-3 hours)
1. Full workflow testing
2. All generation modes
3. Preset integration
4. Credits system

## Benefits

1. **Better Organization**: Clear separation of generation modes
2. **Hook Reusability**: Can use image/video generation elsewhere
3. **Testability**: Each generation mode testable independently
4. **Maintainability**: Easier to update specific features
5. **Performance**: Better memoization with focused hooks
6. **Type Safety**: Clearer interfaces
7. **Readability**: 200 lines vs 1,313 lines

## Testing Checklist

After refactoring, ensure:
- [ ] Image generation works
- [ ] Video generation works
- [ ] Batch generation works
- [ ] Preset loading from URL works
- [ ] Project save/load works
- [ ] Credits deduction works
- [ ] Saved images functionality works
- [ ] Tab switching works
- [ ] All existing panels still work
- [ ] Toast notifications work
- [ ] Error handling works
- [ ] Loading states correct
- [ ] Responsive design maintained

## Timeline Estimate

- Phase 1 (Types): 1-2 hours
- Phase 2 (Logic): 3-4 hours
- Phase 3 (Hooks): 6-8 hours
- Phase 4 (Components): 4-5 hours
- Phase 5 (Main): 2-3 hours
- Phase 6 (Testing): 2-3 hours

**Total**: 18-25 hours

## Risk Assessment

**MEDIUM RISK**: Core feature but already partially refactored

**Mitigation**:
1. Many components already extracted
2. Feature branch development
3. Extensive testing
4. Can be gradual migration
5. Good foundation already exists

## Success Metrics

- ✅ 85% file size reduction
- ✅ State hooks from 18 to <8
- ✅ All functionality preserved
- ✅ Test coverage >70%
- ✅ Better performance

## Notes

- Keep all existing extracted components
- Maintain integration with `TabbedPlaygroundLayout`
- Preserve all generation modes
- Keep batch progress tracker
- Maintain toast system integration
- Add better error boundaries
- Consider WebSocket for real-time video status
