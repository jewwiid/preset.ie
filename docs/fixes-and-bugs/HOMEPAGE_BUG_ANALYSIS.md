# Homepage Data Fetching Bug Analysis

## Issue Identified

### Race Condition in Profile Loading

**Location:** `apps/web/app/page.tsx` and `apps/web/app/hooks/usePlatformGeneratedImages.ts`

### The Bug

1. **Incorrect Data Merging** (Line 183 in page.tsx):
```typescript
const allTalents = [...getTalentProfiles(), ...getContributorProfiles()];
```
This merges BOTH talent profiles and contributor profiles into a single array called `allTalents`, which is misleading and causes incorrect data usage.

2. **Race Condition in Hook** (usePlatformGeneratedImages.ts, lines 92-133):
```typescript
const [talentResponse, contributorResponse] = await Promise.allSettled([
  fetch('/api/talent-profiles?limit=4&role=TALENT'),
  fetch('/api/talent-profiles?limit=4&role=CONTRIBUTOR')
]);
```
Both fetches happen simultaneously, and each triggers a separate `setState` call:
- `setTalentProfiles(talentData || []);` (line 120)
- `setContributorProfiles(contributorData || []);` (line 128)

This causes:
- Multiple re-renders as each state update triggers a re-render
- Potential race conditions where getter functions return stale data
- The `useEffect` in page.tsx (line 182) runs with incomplete data initially

### Data Flow Issues

1. **Initial Mount**: Hook fetches start, but `talentProfiles` and `contributorProfiles` are empty arrays
2. **First Response**: Let's say talents arrive first → `setTalentProfiles` → re-render
3. **Second Response**: Contributors arrive → `setContributorProfiles` → another re-render
4. **useEffect Runs**: Line 183 merges both, but timing is unpredictable
5. **Display Sections**: Lines 909 and 1149 correctly separate them, but may see flickering

### Additional Problems

**Line 183 Logic Error:**
```typescript
const allTalents = [...getTalentProfiles(), ...getContributorProfiles()];
```
Then uses this merged array to find avatar images for roles:
```typescript
imageUrl: allTalents.find(t => t.professional_skills?.some(s => s.includes('Photography')))?.avatar_url
```

This means:
- A **contributor photographer** might be used for the "Photographer" role card
- A **talent model** might be used for the "Model" role card
- The distinction between talent (for hire) vs contributor (provides services) is lost

### Recommendations

1. **Fix the Merged Array**: Don't merge talents and contributors - they serve different purposes
   - Talents = people for hire (actors, models, performers)
   - Contributors = service providers (photographers, videographers, studios)

2. **Optimize State Updates**: Batch state updates or use a single state object:
```typescript
const [profiles, setProfiles] = useState({
  talents: [],
  contributors: [],
  loading: true
});
```

3. **Fix Role Card Images**: Use only contributor profiles for service-based roles (photographer, videographer) and talent profiles for performance roles (actor, model)

4. **Refactor Homepage**: At 1600 lines, it's too large. Split into:
   - HeroSection
   - TalentForHireSection
   - ContributorSection
   - CreativeRolesSection
   - FeaturedWorkSection
   - etc.

## File Size

- **Current**: 1600 lines (extremely difficult to maintain)
- **Target**: ~300-400 lines main file, rest in components
- **Refactoring Priority**: HIGH

## Performance Impact

- Multiple unnecessary re-renders
- Flickering as data loads incrementally
- Incorrect profile matching for role cards
- Confused UX (showing contributors in talent section and vice versa)
