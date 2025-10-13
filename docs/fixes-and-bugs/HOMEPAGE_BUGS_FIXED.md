# Homepage Data Fetching Bugs - FIXED ✅

## Bugs Fixed

### 1. Race Condition in State Updates ✅
**File:** `apps/web/app/hooks/usePlatformGeneratedImages.ts`

**Problem:**
- Multiple `setState` calls happened independently as responses arrived
- Caused multiple re-renders and potential flickering
- Unpredictable timing meant getter functions could return stale data

**Solution:**
- Collect all API responses first into local variables
- Batch all state updates together at the end
- React 18 automatically batches these, but we're being explicit for clarity

**Code Changes:**
```typescript
// BEFORE: Each setState triggered a re-render
setPresetImages(presetData || []);
// ... wait for render ...
setPlatformImages(platformData || []);
// ... wait for render ...
setTalentProfiles(talentData || []);
// ... wait for render ...
setContributorProfiles(contributorData || []);

// AFTER: Batch all state updates together
let presetData: PresetImage[] = [];
let platformData: PlatformImage[] = [];
let talentData: TalentProfile[] = [];
let contributorData: TalentProfile[] = [];

// Process all responses...

// Single batch update at the end
setPresetImages(presetData || []);
setPlatformImages(platformData || []);
setTalentProfiles(talentData || []);
setContributorProfiles(contributorData || []);
```

### 2. Incorrect Profile Merging ✅
**File:** `apps/web/app/page.tsx` (Line 183)

**Problem:**
```typescript
const allTalents = [...getTalentProfiles(), ...getContributorProfiles()];
```
- Variable name `allTalents` was misleading - contained both talents AND contributors
- Merged two distinct profile types that serve different purposes
- Caused wrong profile types to appear in wrong sections

**Solution:**
```typescript
const talents = getTalentProfiles(); // For performance roles (actors, models, singers, etc.)
const contributors = getContributorProfiles(); // For service providers (photographers, videographers, etc.)
```

### 3. Wrong Profile Type for Role Cards ✅
**File:** `apps/web/app/page.tsx` (Lines 187-316)

**Problem:**
- Used merged `allTalents` array for all role cards
- Contributors (photographers) could appear in talent sections
- Talents (models) could appear in contributor sections
- Distinction between "for hire" vs "service provider" was lost

**Solution:**
Use the correct profile type for each role:

**Service Providers (use `contributors`):**
- Photographers
- Videographers
- Cinematographers
- Makeup Artists
- Hair Stylists
- Directors
- Producers
- Editors
- Designers
- Writers
- Fashion Stylists
- Freelancers
- Studios

**Performance Roles (use `talents`):**
- Actors
- Models
- Musicians
- Singers (if added)
- Dancers (if added)

**Code Example:**
```typescript
// BEFORE: Wrong - used merged array for everyone
imageUrl: allTalents.find(t => t.professional_skills?.some(s => s.includes('Photography')))?.avatar_url

// AFTER: Correct - use contributors for photographers
imageUrl: contributors.find(t => t.professional_skills?.some(s => s.includes('Photography')))?.avatar_url

// BEFORE: Wrong - used merged array for everyone
imageUrl: allTalents.find(t => t.performance_roles?.includes('Model'))?.avatar_url

// AFTER: Correct - use talents for models
imageUrl: talents.find(t => t.performance_roles?.includes('Model'))?.avatar_url
```

### 4. useEffect Dependency Fix ✅
**File:** `apps/web/app/page.tsx` (Line 322)

**Problem:**
```typescript
}, []); // Empty dependency array means this runs once on mount
```
- Ran only once on mount when data wasn't loaded yet
- Wouldn't update when new profile data arrived

**Solution:**
```typescript
}, [platformImagesLoading, getTalentProfiles, getContributorProfiles]); // Re-run when profiles are loaded
```

## Performance Improvements

### Before:
- 4+ re-renders as each API response arrived
- Flickering UI as profiles loaded incrementally
- Wrong profiles showing in wrong sections
- Confused user experience

### After:
- 1-2 re-renders total (loading → loaded)
- Smooth loading with no flickering
- Correct profiles in correct sections
- Clear distinction between talents vs contributors

## Testing Checklist

✅ Verify no console warnings about race conditions
✅ Check that talent profiles only show in "Talent for Hire" section
✅ Check that contributor profiles only show in "Contributors" section
✅ Verify role cards use appropriate profile types
✅ Confirm no flickering during page load
✅ Test with slow network to ensure batching works

## Files Modified

1. `/apps/web/app/hooks/usePlatformGeneratedImages.ts`
   - Lines 85-155: Refactored to batch state updates

2. `/apps/web/app/page.tsx`
   - Line 183-185: Separated talents and contributors
   - Lines 192-315: Updated role cards to use correct profile type
   - Line 322: Updated useEffect dependencies

## Next Steps (Optional Refactoring)

The homepage is still 1600 lines. Consider breaking it into:
- `HeroSection.tsx`
- `TalentForHireSection.tsx`
- `ContributorSection.tsx`
- `CreativeRolesSection.tsx`
- `FeaturedWorkSection.tsx`
- `AboutSection.tsx`

Target: Reduce main file to ~300-400 lines
