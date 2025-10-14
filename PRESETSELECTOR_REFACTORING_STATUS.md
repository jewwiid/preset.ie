# PresetSelector Refactoring - Status & Next Steps

## Current Progress: Phase 2.2 - 70% Complete

### ✅ Components Created (4 files)

1. **[usePresetSearch.ts](apps/web/hooks/usePresetSearch.ts)** (~90 lines)
   - Custom hook for preset search logic
   - Handles fetching, filtering, sorting
   - Debounced search implementation
   - State management for presets, loading, errors

2. **[PresetCard.tsx](apps/web/app/components/playground/PresetCard.tsx)** (~230 lines)
   - Grid and list view rendering
   - Badge display (category, type, generation mode, video)
   - Stats (usage count, likes)
   - Delete functionality
   - Highlighting for featured/trending

3. **[PresetFilters.tsx](apps/web/app/components/playground/PresetFilters.tsx)** (~100 lines)
   - Search input with Enter key and clear button
   - Category dropdown selector
   - Sort dropdown (popular, likes, newest, name, usage)
   - View mode toggle (grid/list)
   - Search button

4. **[PresetCategoryNav.tsx](apps/web/app/components/playground/PresetCategoryNav.tsx)** (~58 lines)
   - Quick access buttons (Headshots, Product Photos, Trending)
   - Active state highlighting
   - Presets count display

### ✅ Backup Created
- `PresetSelector.tsx.backup` (1,391 lines) created successfully

---

## 🔄 Next Steps: Integration (30% Remaining)

### Step 1: Update PresetSelector Imports

Add to top of PresetSelector.tsx:
```typescript
import { usePresetSearch } from '../../../hooks/usePresetSearch';
import PresetCard from './PresetCard';
import PresetFilters from './PresetFilters';
import PresetCategoryNav from './PresetCategoryNav';
```

### Step 2: Replace State Management

**Current (lines 96-103)**:
```typescript
const [presets, setPresets] = useState<Preset[]>([])
const [loading, setLoading] = useState(false)
const [searchQuery, setSearchQuery] = useState('')
const [selectedCategory, setSelectedCategory] = useState('all')
const [sortBy, setSortBy] = useState('popular')
```

**Replace with**:
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [selectedCategory, setSelectedCategory] = useState('all')
const [sortBy, setSortBy] = useState('popular')

const { presets, loading, fetchPresets } = usePresetSearch({
  category: selectedCategory,
  searchQuery,
  sortBy,
  limit: 20,
});
```

### Step 3: Replace fetchPresets Function

**Remove** (lines 271-303):
```typescript
const fetchPresets = async () => {
  // ... entire function
}
```

**Already handled by** `usePresetSearch` hook

### Step 4: Replace Search/Filter UI

**Current** (lines 574-626):
```typescript
<div className="flex space-x-2">
  <Input placeholder="Search presets..." ... />
  ...
</div>
```

**Replace with**:
```typescript
<PresetFilters
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  sortBy={sortBy}
  onSortChange={setSortBy}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  onSearch={fetchPresets}
  onClearSearch={() => {
    setSearchQuery('');
    fetchPresets();
  }}
  categories={categories}
/>
```

### Step 5: Replace Category Navigation

**Current** (lines 628-683):
```typescript
<div className="flex justify-between items-center">
  <div className="flex items-center space-x-2">
    <Button variant={...} ... />
    ...
  </div>
</div>
```

**Replace with**:
```typescript
<PresetCategoryNav
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  showTrending={showTrending}
  onToggleTrending={() => setShowTrending(!showTrending)}
  presetsCount={showTrending ? trendingPresets.length : presets.length}
/>
```

### Step 6: Replace Preset Card Rendering

**Current** (lines 705-752 for trending, 818-900 for regular):
```typescript
{trendingPresets.map(preset => (
  viewMode === 'grid' ? (
    <Card key={preset.id} ... >
      <CardHeader>...</CardHeader>
      <CardContent>...</CardContent>
    </Card>
  ) : (
    <div key={preset.id} ... >...</div>
  )
))}
```

**Replace with**:
```typescript
{trendingPresets.map(preset => (
  <PresetCard
    key={preset.id}
    preset={preset}
    viewMode={viewMode}
    onClick={handlePresetSelect}
    highlighted={true}
  />
))}

// For regular presets:
{presets.map(preset => (
  <PresetCard
    key={preset.id}
    preset={preset}
    viewMode={viewMode}
    onClick={handlePresetSelect}
    onDelete={confirmDelete}
    showDeleteButton={true}
  />
))}
```

### Step 7: Remove Helper Functions

**Remove** (can be deleted after refactor):
- `getCategoryColor()` (now in PresetCard)
- `getPresetTypeBadge()` (now in PresetCard)
- `getGenerationModeBadge()` (now in PresetCard)
- `getVideoSettingsBadge()` (now in PresetCard)

---

## Expected Results

### Before Refactoring
- **Total Lines**: 1,391
- **Component Complexity**: Very High
- **State Management**: 13+ useState hooks
- **Fetch Logic**: ~32 lines inline
- **Card Rendering**: ~200 lines of duplicate JSX
- **Helper Functions**: ~100 lines inline

### After Refactoring
- **Main Component**: ~350 lines (75% reduction)
- **Extracted to Hooks**: ~90 lines (usePresetSearch)
- **Extracted to Components**: ~388 lines (3 components)
- **Total New Files**: 4 files
- **Maintainability**: Significantly improved
- **Reusability**: High (components can be used elsewhere)

---

## Files Modified

### To Modify
1. `/apps/web/app/components/playground/PresetSelector.tsx`
   - Add imports
   - Replace state with hook
   - Replace UI sections with components
   - Remove helper functions

### Created (Ready to Use)
1. `/apps/web/hooks/usePresetSearch.ts` ✅
2. `/apps/web/app/components/playground/PresetCard.tsx` ✅
3. `/apps/web/app/components/playground/PresetFilters.tsx` ✅
4. `/apps/web/app/components/playground/PresetCategoryNav.tsx` ✅

### Backup
- `/apps/web/app/components/playground/PresetSelector.tsx.backup` ✅

---

## Testing Checklist

After integration:
- [ ] Build passes without errors
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Sort functionality works
- [ ] Grid/List view toggle works
- [ ] Trending presets display correctly
- [ ] Preset cards render properly in both views
- [ ] Delete functionality works
- [ ] Preset selection works
- [ ] Loading states display correctly
- [ ] Empty states display correctly

---

## Potential Issues & Solutions

### Issue 1: Type Mismatches
**Problem**: Preset interface might differ between components
**Solution**: Export shared `Preset` interface from a types file

### Issue 2: Missing Dependencies
**Problem**: Some functions might depend on context not passed to components
**Solution**: Pass additional callbacks as props or use context

### Issue 3: State Synchronization
**Problem**: Search state and hook state might desync
**Solution**: Ensure all state updates trigger appropriate effects

---

## Next Phase After PresetSelector

Once PresetSelector refactoring is complete and tested:

### Phase 3.1: ApplicantPreferencesStep (1,477 lines)
**Priority**: MEDIUM
**Estimated Time**: 6 hours

**Refactoring Tasks**:
1. Extract applicant data hook
2. Create preference card components
3. Separate form validation logic
4. Create step navigation component

### Phase 3.2: ProfileContentEnhanced (1,045 lines)
**Priority**: MEDIUM
**Estimated Time**: 5 hours

**Refactoring Tasks**:
1. Extract profile sections into components
2. Create stats dashboard component
3. Separate edit mode functionality
4. Create media grid component

---

## Commands

### Test Build
```bash
npm run build
```

### Verify Files Created
```bash
ls -la apps/web/hooks/usePresetSearch.ts
ls -la apps/web/app/components/playground/PresetCard.tsx
ls -la apps/web/app/components/playground/PresetFilters.tsx
ls -la apps/web/app/components/playground/PresetCategoryNav.tsx
```

### Compare Before/After
```bash
wc -l apps/web/app/components/playground/PresetSelector.tsx.backup
wc -l apps/web/app/components/playground/PresetSelector.tsx
```

---

## Summary

**Status**: 70% Complete (4/6 tasks done)
**Remaining Work**: Integration and testing (~2 hours)
**Files Created**: 4 new files + 1 backup
**Lines Written**: ~478 new lines
**Expected Reduction**: ~1,041 lines from main component

The foundation is complete. Final integration involves replacing inline code with component calls and testing all functionality.
