# Gigs Page Refactoring Plan

## Current State
- **File**: `app/gigs/page.tsx`
- **Original Line Count**: 1682 lines
- **Refactored Line Count**: 221 lines (87% reduction!)
- **Status**: ✅ REFACTORING COMPLETE

## Completed
✅ Created `types.ts` - All TypeScript interfaces and types
✅ Created `utils.tsx` - Utility functions (formatting, colors, etc.)
✅ Created `hooks/useGigs.ts` - Data fetching and management (~220 lines)
✅ Created `hooks/useSavedGigs.ts` - Saved gigs functionality (~95 lines)
✅ Created `hooks/useGigFilters.ts` - Filter state management (~140 lines)
✅ Created `hooks/useSimulatedData.ts` - Mock data generation (~90 lines)
✅ Created `lib/filterGigs.ts` - Filtering logic (~165 lines)
✅ Created `components/GigCard.tsx` - Individual gig display (~175 lines)
✅ Created `components/GigFilters.tsx` - Filter UI (~580 lines)
✅ Created `components/GigGrid.tsx` - Grid layout with pagination (~70 lines)
✅ Created `components/EmptyState.tsx` - No results state (~30 lines)
✅ Refactored `page.tsx` - Main orchestrator (~221 lines)

## Proposed Structure

```
app/gigs/
├── page.tsx (main orchestrator, ~200-300 lines)
├── types.ts ✅
├── utils.tsx ✅
├── hooks/
│   ├── useGigs.ts (fetchGigs, data management)
│   ├── useSavedGigs.ts (fetchSavedGigs, toggleSaveGig)
│   ├── useGigFilters.ts (all filter state and logic)
│   └── useSimulatedData.ts (simulated data generation)
├── components/
│   ├── GigHeader.tsx (hero banner with background image)
│   ├── GigFilters.tsx (search and filter UI)
│   ├── GigCard.tsx (individual gig card display)
│   ├── GigGrid.tsx (grid layout and pagination)
│   └── EmptyState.tsx (no gigs found state)
└── lib/
    └── filterGigs.ts (filtering logic)
```

## Files to Create

### 1. `hooks/useGigs.ts`
**Purpose**: Data fetching and management
**Lines**: ~150
**Exports**:
- `useGigs()` hook
- Returns: `{ gigs, loading, refetch, headerImage }`
- Handles: fetchGigs, fetchHeaderImage, fetchAvailablePalettes, fetchAvailableRoleTypes, fetchAvailableSpecializations

### 2. `hooks/useSavedGigs.ts`
**Purpose**: Saved gigs functionality
**Lines**: ~80
**Exports**:
- `useSavedGigs()` hook
- Returns: `{ savedGigs, toggleSaveGig, loading }`

### 3. `hooks/useGigFilters.ts`
**Purpose**: All filter state management
**Lines**: ~100
**Exports**:
- `useGigFilters()` hook
- Returns: All filter states and setters
- Manages: 20+ filter states

### 4. `hooks/useSimulatedData.ts`
**Purpose**: Generate simulated/mock data
**Lines**: ~200
**Exports**:
- `useSimulatedData()` hook
- Functions: getSimulatedGigData, getSimulatedPaletteColors

### 5. `lib/filterGigs.ts`
**Purpose**: Core filtering logic
**Lines**: ~150
**Exports**:
- `filterGigs(gigs, filters)` function
- Pure function with no side effects

### 6. `components/GigHeader.tsx`
**Purpose**: Hero banner section
**Lines**: ~100
**Props**: `{ gigsCount, headerImage }`

### 7. `components/GigFilters.tsx`
**Purpose**: Search and filter UI
**Lines**: ~300
**Props**: Filter states and setters

### 8. `components/GigCard.tsx`
**Purpose**: Individual gig display
**Lines**: ~200
**Props**: `{ gig, isSaved, onToggleSave }`

### 9. `components/GigGrid.tsx`
**Purpose**: Grid layout with pagination
**Lines**: ~150
**Props**: `{ gigs, savedGigs, onToggleSave, loading }`

### 10. `components/EmptyState.tsx`
**Purpose**: No results state
**Lines**: ~50
**Props**: `{ hasFilters, onClearFilters }`

## Migration Strategy

### Phase 1: Extract Utilities (COMPLETED)
- ✅ Create `types.ts`
- ✅ Create `utils.tsx`

### Phase 2: Extract Hooks (COMPLETED)
1. ✅ Create `hooks/useGigs.ts`
2. ✅ Create `hooks/useSavedGigs.ts`
3. ✅ Create `hooks/useGigFilters.ts`
4. ✅ Create `hooks/useSimulatedData.ts`

### Phase 3: Extract Components (COMPLETED)
1. ✅ Create `components/GigCard.tsx`
2. ✅ Create `components/GigGrid.tsx`
3. ✅ Create `components/GigFilters.tsx`
4. ✅ Create `components/EmptyState.tsx`

### Phase 4: Extract Business Logic (COMPLETED)
1. ✅ Create `lib/filterGigs.ts`

### Phase 5: Refactor Main Page (COMPLETED)
1. ✅ Update `page.tsx` to use all new hooks
2. ✅ Update `page.tsx` to use all new components
3. ✅ Remove old code

## Benefits

1. **Maintainability**: Each file has a single responsibility
2. **Testability**: Hooks and utilities can be unit tested
3. **Reusability**: Components can be reused in other pages
4. **Readability**: ~200 line main file vs 1682 lines
5. **Performance**: Easier to optimize individual components
6. **Collaboration**: Multiple developers can work on different components

## Testing Checklist

After refactoring, ensure:
- [ ] All gigs load correctly
- [ ] Filtering works for all filter types
- [ ] Pagination works correctly
- [ ] Save/unsave functionality works
- [ ] Header image displays when set
- [ ] Responsive design works on all screen sizes
- [ ] No console errors
- [ ] Performance is not degraded

**Testing Status**: Ready for manual testing. TypeScript compilation passes with no errors in gigs directory.

## Timeline Estimate

- Phase 2 (Hooks): 2-3 hours
- Phase 3 (Components): 3-4 hours
- Phase 4 (Logic): 1 hour
- Phase 5 (Main Page): 1-2 hours
- Testing: 2 hours

**Total**: 9-12 hours of development time

## Notes

- Keep all existing functionality
- Don't change UI/UX
- Focus on code organization
- Add JSDoc comments to all new files
- Use TypeScript strictly
- Follow existing code patterns and conventions
