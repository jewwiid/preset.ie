# Matchmaking System Gap Analysis

## Current Database Schema

### Gigs Table
```sql
comp_type: compensation_type (enum: 'TFP', 'PAID', 'EXPENSES_ONLY')
comp_details: text (free-form compensation description)
location_text: varchar(255)
city: varchar(100)
style_tags: text[]
start_time, end_time: timestamptz
```

### Users_Profile Table
```sql
hourly_rate_min: numeric
hourly_rate_max: numeric
city: varchar(255)
style_tags: text[]
role_flags: user_role[]
```

## Current Matchmaking Algorithm

The `calculate_gig_compatibility()` function scores on:
- **Base score**: 50 points (always)
- **Location match**: +20 points (city name in location_text)
- **Style tags**: +15 points (if user has any style tags)
- **Role compatibility**: +15 points (if user is TALENT)
- **Max score**: 100 points

## Critical Gaps

### 1. **No Budget/Rate Matching**
**Problem**: Gigs don't specify budget ranges, only comp_type + free-text details
- A talent charging $150/hr could match with a gig offering $20/hr
- No way to filter "PAID" gigs by actual budget
- `comp_details` is unstructured text, not queryable

**Impact**: Poor matches, wasted time for both parties

**Solution Options**:

#### Option A: Add Budget Fields to Gigs Table (Recommended)
```sql
ALTER TABLE gigs
ADD COLUMN budget_min NUMERIC,
ADD COLUMN budget_max NUMERIC,
ADD COLUMN budget_type VARCHAR(20) CHECK (budget_type IN ('hourly', 'per_project', 'per_day'));
```

Benefits:
- Can match talent hourly_rate with gig budget
- Can filter/sort by budget
- Can show budget range in UI
- Add +20 points to compatibility if rates overlap

#### Option B: Parse comp_details with AI/Regex
- Extract budget from free text
- Store in computed column or cache
- Less reliable, more expensive

### 2. **Weak Location Matching**
**Current**: Simple substring match (`city IN location_text`)
- Doesn't account for distance
- "New York" won't match "NYC"
- No radius-based search despite `radius_meters` field existing

**Solution**: Use PostGIS distance calculation
```sql
-- Gigs already have: location geography(Point,4326), radius_meters
-- Users need: location field for distance calculation
ST_DWithin(
    gig.location,
    user.location,
    gig.radius_meters
) -- +25 points if within radius
```

### 3. **No Experience/Skill Matching**
**Available but Unused**:
- `users_profile.years_experience` - not in algorithm
- `users_profile.specializations` - not compared with gig requirements
- No gig field for required experience level

**Solution**: Add to gigs table and algorithm
```sql
ALTER TABLE gigs
ADD COLUMN required_experience_min INTEGER, -- min years
ADD COLUMN required_specializations TEXT[]; -- matching with user specializations

-- In compatibility function:
-- +15 points if user.years_experience >= gig.required_experience_min
-- +20 points if user.specializations overlaps with gig.required_specializations
```

### 4. **No Availability Matching**
**Problem**:
- Users have `available_for_travel`, `travel_radius_km` - not used
- No check if user is already booked during gig dates
- No "busy/available" status matching

**Solution**:
```sql
-- Check calendar conflicts
SELECT COUNT(*) FROM applications
WHERE applicant_id = user.id
AND status IN ('ACCEPTED', 'CONFIRMED')
AND (
    (start_time, end_time) OVERLAPS (gig.start_time, gig.end_time)
)
-- Reduce score by 30 points if conflict exists
```

### 5. **Missing Preference Filters**
**What users can't do**:
- "Only show TFP gigs"
- "Only paid gigs above $100/hr"
- "Within 50km of my location"
- "Fashion photography only"
- "Weekend gigs only"

**Solution**: Add to `get_user_gig_recommendations()` WHERE clause
```sql
WHERE g.status = 'OPEN'
  AND (p_comp_types IS NULL OR g.comp_type = ANY(p_comp_types))
  AND (p_budget_min IS NULL OR g.budget_min >= p_budget_min)
  AND (p_style_tags IS NULL OR g.style_tags && p_style_tags)
  AND (p_max_distance IS NULL OR ST_DWithin(g.location, user_location, p_max_distance))
```

### 6. **Return Data Doesn't Include Key Info**
`get_user_gig_recommendations()` returns:
```sql
gig_id, title, description, location_text, comp_type, comp_details,
compatibility_score, owner_display_name, start_time, end_time
```

**Missing**:
- `city`, `country` - for location filtering UI
- `style_tags` - to show match reasons
- `max_applicants` vs current applicant count - to show urgency
- `application_deadline` - critical for user decision
- Talent's `hourly_rate` - for budget comparison
- Distance from user - if location matching enabled

## Recommended Priority

### Phase 1: Quick Wins (Minimal Schema Changes)
1. ✅ Fix `get_user_gig_recommendations` to return actual gig columns
2. Add more return fields (deadline, city, style_tags, applicant_count)
3. Add basic filtering parameters (comp_types, date_range)
4. Enhance compatibility scoring:
   - Better location matching (city exact match vs contains)
   - Style tags overlap percentage
   - Time match (weekend vs weekday)

### Phase 2: Budget Matching (High Impact)
1. Add `budget_min`, `budget_max`, `budget_type` to gigs table
2. Update gig create/edit forms to collect budget
3. Update compatibility algorithm to score budget/rate overlap
4. Add budget filters to recommendations

### Phase 3: Advanced Matching (Lower Priority)
1. Add experience requirements to gigs
2. Implement PostGIS distance matching
3. Add calendar conflict detection
4. Add specialization matching

## Migration Strategy

**For Existing Gigs** (without budget fields):
```sql
-- Option 1: Leave NULL (users must update)
-- Option 2: Parse comp_details with GPT-4 to extract budget
-- Option 3: Set defaults based on comp_type
UPDATE gigs
SET budget_type = 'per_project',
    budget_min = CASE
        WHEN comp_type = 'TFP' THEN 0
        WHEN comp_type = 'EXPENSES_ONLY' THEN 0
        WHEN comp_type = 'PAID' THEN NULL -- Force update
    END
WHERE budget_min IS NULL;
```

## Code Changes Required

1. **Migration**: Add budget columns to gigs
2. **Forms**: Update GigCreate and GigEdit to include budget fields
3. **Function**: Update `get_user_gig_recommendations()` signature and logic
4. **Function**: Enhance `calculate_gig_compatibility()` scoring
5. **Types**: Update TypeScript interfaces
6. **UI**: Show budget in gig cards, add budget filters

## Testing Checklist

- [ ] Gigs without budget show N/A or prompt to add
- [ ] Budget matching doesn't break TFP/EXPENSES_ONLY gigs
- [ ] Compatibility scores are sensible (not always 50 or 100)
- [ ] Filters work correctly (no false positives)
- [ ] Performance with 1000s of gigs/users
- [ ] Edge cases: NULL values, extreme ranges, etc.

## Estimated Effort

- Phase 1: 2-3 hours (function updates + UI tweaks)
- Phase 2: 4-6 hours (migration + forms + algorithm)
- Phase 3: 8-10 hours (complex geo queries + calendar)

**Total**: ~2-3 days for full implementation
