# MoodboardBuilder.tsx Refactoring Plan

## Current State
- **File**: `app/components/MoodboardBuilder.tsx`
- **Line Count**: 2,623 lines
- **State Complexity**: 59 useState/useEffect calls
- **Status**: 🔴 CRITICAL - Needs immediate refactoring
- **Impact**: High (core feature used in gigs, treatments, showcases)

## Problems Identified
1. **Single Responsibility Violation**: Manages uploads, Pexels search, enhancements, AI analysis, palette extraction, drag-and-drop
2. **State Management Hell**: 59 state hooks with complex dependencies
3. **Testing Nightmare**: Impossible to unit test individual features
4. **Performance Issues**: Re-renders entire component on any state change
5. **Code Duplication**: Similar logic for different image sources
6. **Hard to Debug**: Too many concerns in one file
7. **Collaboration Blocker**: Multiple developers can't work on different features

## Proposed Structure

```
app/components/moodboard/
├── MoodboardBuilder.tsx (main orchestrator, ~250 lines)
│
├── hooks/
│   ├── useMoodboardData.ts (~150 lines)
│   │   - fetchMoodboard, saveMoodboard, loadGigData
│   │   - moodboard CRUD operations
│   │
│   ├── useMoodboardItems.ts (~200 lines)
│   │   - items state management
│   │   - add, remove, reorder items
│   │   - featured image selection
│   │
│   ├── usePexelsSearch.ts (~180 lines)
│   │   - Pexels API integration
│   │   - search, pagination, filters
│   │   - results state management
│   │
│   ├── useImageUpload.ts (~150 lines)
│   │   - file upload handling
│   │   - URL imports
│   │   - validation and optimization
│   │
│   ├── useImageEnhancement.ts (~250 lines)
│   │   - enhancement requests
│   │   - polling for completion
│   │   - provider selection (nanobanana/seedream)
│   │   - cost tracking
│   │
│   ├── useColorPalette.ts (~120 lines)
│   │   - palette extraction (standard + AI)
│   │   - palette display and selection
│   │
│   ├── useAIAnalysis.ts (~100 lines)
│   │   - AI-powered moodboard analysis
│   │   - description and mood generation
│   │
│   └── useUserCredits.ts (~80 lines)
│       - fetch user credits
│       - subscription tier management
│
├── components/
│   ├── MoodboardHeader.tsx (~100 lines)
│   │   - Title, description inputs
│   │   - Save/cancel buttons
│   │   - Status indicators
│   │
│   ├── MoodboardTabs.tsx (~80 lines)
│   │   - Tab navigation (upload/pexels/saved/url/enhance)
│   │   - Tab content wrapper
│   │
│   ├── ImageUploadPanel.tsx (~150 lines)
│   │   - File drop zone
│   │   - Upload progress
│   │   - File validation UI
│   │
│   ├── PexelsSearchPanel.tsx (~250 lines)
│   │   - Search input and filters
│   │   - Results grid
│   │   - Pagination controls
│   │   - Photo attribution
│   │
│   ├── URLImportPanel.tsx (~100 lines)
│   │   - URL input field
│   │   - Import preview
│   │   - Validation feedback
│   │
│   ├── SavedImagesPanel.tsx (~120 lines)
│   │   - User's saved images
│   │   - Selection interface
│   │
│   ├── EnhancementPanel.tsx (~200 lines)
│   │   - Enhancement controls
│   │   - Provider selector
│   │   - Enhancement queue
│   │
│   ├── MoodboardGrid.tsx (~200 lines)
│   │   - Drag-and-drop grid (uses DraggableMasonryGrid)
│   │   - Item cards with actions
│   │   - Featured image indicator
│   │
│   ├── MoodboardItemCard.tsx (~150 lines)
│   │   - Individual item display
│   │   - Actions (enhance, remove, set featured)
│   │   - Enhancement status
│   │   - Attribution
│   │
│   ├── PaletteDisplay.tsx (~100 lines)
│   │   - Color palette visualization
│   │   - AI/Standard toggle
│   │   - Extract button
│   │
│   └── EnhancementModal.tsx (existing - already extracted)
│       - Enhancement configuration UI
│
├── lib/
│   ├── moodboardTypes.ts (~100 lines)
│   │   - TypeScript interfaces
│   │   - Type definitions
│   │
│   ├── moodboardHelpers.ts (~150 lines)
│   │   - Utility functions
│   │   - Data transformations
│   │   - Validation logic
│   │
│   ├── imageProcessing.ts (~120 lines)
│   │   - Image optimization
│   │   - Format conversion
│   │   - Size calculations
│   │
│   ├── pexelsClient.ts (~100 lines)
│   │   - Pexels API client
│   │   - Request formatting
│   │   - Response parsing
│   │
│   └── enhancementClient.ts (~150 lines)
│       - Enhancement API clients
│       - Polling logic
│       - Task status tracking
│
└── constants/
    └── moodboardConfig.ts (~50 lines)
        - Default values
        - Limits and quotas
        - Provider configs
```

## Files to Create

### Phase 1: Extract Types and Utilities

#### 1. `moodboard/lib/moodboardTypes.ts`
**Lines**: ~100
**Exports**: All TypeScript interfaces
```typescript
- MoodboardItem
- EnhancementRequest
- MoodboardBuilderProps
- PexelsFilters
- EnhancementTask
- etc.
```

#### 2. `moodboard/lib/moodboardHelpers.ts`
**Lines**: ~150
**Exports**: Pure utility functions
```typescript
- validateImageUrl()
- formatImageSize()
- calculateEstimatedCost()
- getEnhancementStatusLabel()
- etc.
```

#### 3. `moodboard/constants/moodboardConfig.ts`
**Lines**: ~50
**Exports**: Configuration constants
```typescript
- MAX_ITEMS
- SUPPORTED_FORMATS
- ENHANCEMENT_PROVIDERS
- etc.
```

### Phase 2: Extract Data Hooks

#### 4. `moodboard/hooks/useMoodboardData.ts`
**Lines**: ~150
**Purpose**: Main moodboard CRUD operations
**Returns**:
```typescript
{
  moodboard: Moodboard | null
  loading: boolean
  error: string | null
  fetchMoodboard: (id: string) => Promise<void>
  saveMoodboard: () => Promise<string>
  updateMoodboard: (data: Partial<Moodboard>) => void
}
```

#### 5. `moodboard/hooks/useMoodboardItems.ts`
**Lines**: ~200
**Purpose**: Items state and operations
**Returns**:
```typescript
{
  items: MoodboardItem[]
  featuredImageId: string | null
  addItem: (item: MoodboardItem) => void
  removeItem: (id: string) => void
  reorderItems: (newOrder: MoodboardItem[]) => void
  setFeaturedImage: (id: string) => void
  updateItemPosition: (id: string, position: number) => void
}
```

#### 6. `moodboard/hooks/usePexelsSearch.ts`
**Lines**: ~180
**Purpose**: Pexels API integration
**Returns**:
```typescript
{
  query: string
  setQuery: (q: string) => void
  results: PexelsPhoto[]
  loading: boolean
  currentPage: number
  totalPages: number
  filters: PexelsFilters
  setFilters: (f: PexelsFilters) => void
  search: () => Promise<void>
  nextPage: () => void
  prevPage: () => void
}
```

#### 7. `moodboard/hooks/useImageUpload.ts`
**Lines**: ~150
**Purpose**: File upload handling
**Returns**:
```typescript
{
  uploading: boolean
  uploadProgress: number
  uploadFile: (file: File) => Promise<string>
  importFromUrl: (url: string) => Promise<MoodboardItem>
  validateFile: (file: File) => { valid: boolean, error?: string }
}
```

#### 8. `moodboard/hooks/useImageEnhancement.ts`
**Lines**: ~250
**Purpose**: Image enhancement system
**Returns**:
```typescript
{
  enhancingItems: Set<string>
  enhancementTasks: Map<string, EnhancementTask>
  selectedProvider: 'nanobanana' | 'seedream'
  setSelectedProvider: (p: Provider) => void
  requestEnhancement: (request: EnhancementRequest) => Promise<void>
  pollEnhancementStatus: (taskId: string) => void
  cancelEnhancement: (taskId: string) => void
}
```

#### 9. `moodboard/hooks/useColorPalette.ts`
**Lines**: ~120
**Purpose**: Palette extraction
**Returns**:
```typescript
{
  palette: string[]
  loading: boolean
  useAI: boolean
  setUseAI: (use: boolean) => void
  extractPalette: (images: string[]) => Promise<void>
}
```

#### 10. `moodboard/hooks/useAIAnalysis.ts`
**Lines**: ~100
**Purpose**: AI analysis features
**Returns**:
```typescript
{
  analysis: AIAnalysis | null
  analyzing: boolean
  generateAnalysis: (moodboard: Moodboard) => Promise<void>
}
```

#### 11. `moodboard/hooks/useUserCredits.ts`
**Lines**: ~80
**Purpose**: Credits management
**Returns**:
```typescript
{
  credits: { current: number, monthly: number }
  tier: SubscriptionTier
  loading: boolean
  refetch: () => Promise<void>
}
```

### Phase 3: Extract UI Components

#### 12. `moodboard/components/MoodboardHeader.tsx`
**Lines**: ~100
**Props**: `{ title, setTitle, description, setDescription, onSave, onCancel, saving }`

#### 13. `moodboard/components/MoodboardTabs.tsx`
**Lines**: ~80
**Props**: `{ activeTab, setActiveTab, children }`

#### 14. `moodboard/components/ImageUploadPanel.tsx`
**Lines**: ~150
**Props**: `{ onUpload, uploading, progress }`

#### 15. `moodboard/components/PexelsSearchPanel.tsx`
**Lines**: ~250
**Props**: `{ query, results, loading, onSearch, onSelect, pagination, filters }`

#### 16. `moodboard/components/URLImportPanel.tsx`
**Lines**: ~100
**Props**: `{ onImport, loading }`

#### 17. `moodboard/components/SavedImagesPanel.tsx`
**Lines**: ~120
**Props**: `{ onSelect }`

#### 18. `moodboard/components/EnhancementPanel.tsx`
**Lines**: ~200
**Props**: `{ items, onEnhance, tasks, provider, setProvider }`

#### 19. `moodboard/components/MoodboardGrid.tsx`
**Lines**: ~200
**Props**: `{ items, onReorder, onRemove, onSetFeatured, featuredId }`

#### 20. `moodboard/components/MoodboardItemCard.tsx`
**Lines**: ~150
**Props**: `{ item, isFeatured, onRemove, onSetFeatured, onEnhance, enhancementStatus }`

#### 21. `moodboard/components/PaletteDisplay.tsx`
**Lines**: ~100
**Props**: `{ palette, loading, useAI, onToggleAI, onExtract }`

### Phase 4: Extract Business Logic

#### 22. `moodboard/lib/imageProcessing.ts`
**Lines**: ~120
**Exports**: Image processing utilities
```typescript
- optimizeImage()
- compressImage()
- getImageDimensions()
- validateImageFormat()
```

#### 23. `moodboard/lib/pexelsClient.ts`
**Lines**: ~100
**Exports**: Pexels API client
```typescript
- searchPhotos()
- getPhoto()
- formatPexelsResult()
```

#### 24. `moodboard/lib/enhancementClient.ts`
**Lines**: ~150
**Exports**: Enhancement API client
```typescript
- createEnhancementTask()
- pollTaskStatus()
- getEnhancementResult()
- cancelTask()
```

### Phase 5: Refactor Main Component

#### 25. `moodboard/MoodboardBuilder.tsx`
**Lines**: ~250 (from 2,623!)
**Purpose**: Main orchestrator using all hooks and components

## Migration Strategy

### Phase 1: Extract Types and Utilities (2-3 hours)
1. ✅ Create `lib/moodboardTypes.ts`
2. ✅ Create `lib/moodboardHelpers.ts`
3. ✅ Create `constants/moodboardConfig.ts`
4. ✅ Test utilities in isolation

### Phase 2: Extract Data Hooks (8-10 hours)
1. Create `hooks/useMoodboardData.ts`
2. Create `hooks/useMoodboardItems.ts`
3. Create `hooks/usePexelsSearch.ts`
4. Create `hooks/useImageUpload.ts`
5. Create `hooks/useImageEnhancement.ts`
6. Create `hooks/useColorPalette.ts`
7. Create `hooks/useAIAnalysis.ts`
8. Create `hooks/useUserCredits.ts`
9. Test each hook individually

### Phase 3: Extract UI Components (10-12 hours)
1. Create header and tabs components
2. Create panel components (upload, pexels, url, saved, enhancement)
3. Create grid and item card components
4. Create palette display component
5. Test each component in Storybook/isolation

### Phase 4: Extract Business Logic (3-4 hours)
1. Create `lib/imageProcessing.ts`
2. Create `lib/pexelsClient.ts`
3. Create `lib/enhancementClient.ts`
4. Unit test all functions

### Phase 5: Refactor Main Component (2-3 hours)
1. Update `MoodboardBuilder.tsx` to use all new hooks
2. Update to use all new components
3. Remove old code
4. Integration testing

### Phase 6: Testing & Polish (3-4 hours)
1. Full integration testing
2. Performance optimization
3. Error handling improvements
4. Documentation

## Benefits

1. **Maintainability**: Each hook/component has one responsibility
2. **Testability**: Can unit test individual features
3. **Performance**: Selective re-renders, memoization opportunities
4. **Reusability**: Components can be reused (e.g., PexelsSearchPanel)
5. **Readability**: 250 line main file vs 2,623 lines
6. **Debugging**: Easier to isolate issues
7. **Collaboration**: Multiple developers can work in parallel
8. **Type Safety**: Better TypeScript support with focused types

## Testing Checklist

After refactoring, ensure:
- [ ] Moodboard creation works
- [ ] File upload works (drag-and-drop, file picker)
- [ ] Pexels search and import works
- [ ] URL import works
- [ ] Saved images loading works
- [ ] Image enhancement works (both providers)
- [ ] Drag-and-drop reordering works
- [ ] Featured image selection works
- [ ] Palette extraction works (standard + AI)
- [ ] AI analysis generation works
- [ ] Save functionality works
- [ ] Credit tracking works
- [ ] All animations and transitions work
- [ ] Responsive design works
- [ ] No console errors
- [ ] Performance is improved

## Timeline Estimate

- Phase 1 (Types/Utils): 2-3 hours
- Phase 2 (Hooks): 8-10 hours
- Phase 3 (Components): 10-12 hours
- Phase 4 (Logic): 3-4 hours
- Phase 5 (Main): 2-3 hours
- Phase 6 (Testing): 3-4 hours

**Total**: 28-36 hours of development time

## Risk Assessment

**HIGH RISK**: This is a critical component used across multiple features
- Gig creation
- Treatment creation
- Showcase creation
- Any feature using visual references

**Mitigation**:
1. Create feature branch
2. Maintain backward compatibility during migration
3. Extensive testing before merge
4. Consider feature flag for gradual rollout
5. Have rollback plan ready

## Success Metrics

- ✅ File size reduced by 90%+ (250 lines vs 2,623)
- ✅ State hooks reduced from 59 to <10 in main component
- ✅ All functionality preserved
- ✅ No performance regression
- ✅ Test coverage >80%
- ✅ Zero critical bugs after 1 week in production

## Notes

- Keep existing `EnhancedEnhancementModal` component (already extracted)
- Keep existing `DraggableMasonryGrid` component (shared utility)
- Maintain all existing prop interfaces for backward compatibility
- Add JSDoc comments to all new files
- Use TypeScript strictly
- Follow existing code patterns
