# Complete Matchmaking System Fix & Enhancement Plan

## 🚨 CRITICAL BUGS FOUND

### Bug #1: Gig Preferences NOT Stored in Database
**Location**: `apps/web/app/gigs/create/page.tsx:316`

```typescript
applicant_preferences: formData.applicantPreferences || {}  // ❌ This column doesn't exist!
```

**Impact**: ALL applicant preferences collected in the UI are silently lost:
- Physical attributes (height, eye color, hair color, tattoos, piercings)
- Professional requirements (experience, specializations, equipment, software)
- Availability (travel, hourly rate budget)
- Languages, age range, additional requirements

**Users fill out detailed preference forms thinking they're setting matchmaking criteria, but NOTHING is saved!**

---

## 📊 FULL ANALYSIS: What's Collected vs What's Stored

### GIG CREATION FLOW - 5 Steps

#### Step 1: Basic Details (BasicDetailsStep.tsx)
**Collected**:
- `lookingFor`: LookingForType[] - Multi-select (50+ role options)
- `title`: string
- `description`: text
- `purpose`: PurposeType (13 options: PORTFOLIO, COMMERCIAL, EDITORIAL, etc.)
- `compType`: CompType (TFP, PAID, EXPENSES, OTHER)
- `compDetails`: text

**Stored in DB**: ✅ All fields stored
- Gigs table columns exist for all

#### Step 2: Location & Schedule (LocationScheduleStep.tsx)
**Collected**:
- `location`: string (location_text)
- `city`: string
- `country`: string
- `start_time`: timestamptz
- `end_time`: timestamptz
- `application_deadline`: timestamptz

**Stored in DB**: ✅ All fields stored

#### Step 3: Requirements (RequirementsStep.tsx)
**Collected**:
- `usage_rights`: string
- `max_applicants`: number
- `safety_notes`: text

**Stored in DB**: ✅ All fields stored

#### Step 4: Applicant Preferences (ApplicantPreferencesStep.tsx) ⚠️
**Collected** (EXTENSIVE):

```typescript
ApplicantPreferences {
  physical: {
    height_range: { min: number, max: number }
    measurements: { required: boolean, specific: string }
    eye_color: { required: boolean, preferred: string[] }
    hair_color: { required: boolean, preferred: string[] }
    tattoos: { allowed: boolean, required: boolean }
    piercings: { allowed: boolean, required: boolean }
    clothing_sizes: { required: boolean, preferred: string[] }
  }
  professional: {
    experience_years: { min: number, max: number }
    specializations: { required: string[], preferred: string[] }
    equipment: { required: string[], preferred: string[] }
    software: { required: string[], preferred: string[] }
    talent_categories: { required: string[], preferred: string[] }
    portfolio_required: boolean
  }
  availability: {
    travel_required: boolean
    travel_radius_km: number | null
    hourly_rate_range: { min: number, max: number }
  }
  other: {
    age_range: { min: number, max: number }
    languages: { required: string[], preferred: string[] }
    additional_requirements: string
  }
}
```

**Stored in DB**: ❌ **NOTHING** - `applicant_preferences` column doesn't exist!

**Options Available**:
- **EYE_COLORS**: 12 options (Blue, Green, Brown, Hazel, Gray, Amber, etc.)
- **HAIR_COLORS**: 15 options (Black, Brown, Blonde, Red, Gray, White, Auburn, etc.)
- **SPECIALIZATIONS**: 50+ (Fashion, Portrait, Event, Commercial photography, etc.)
- **EQUIPMENT_LIST**: 40+ items (DSLR, Mirrorless, Lighting, Tripods, etc.)
- **SOFTWARE_LIST**: 25+ (Photoshop, Lightroom, Premiere, After Effects, etc.)
- **TALENT_CATEGORIES**: 20+ (Model, Actor, Dancer, Performer, etc.)
- **LANGUAGES**: 50+ languages
- **CLOTHING_SIZES**: XS through 5XL

**Conditional Display Logic** (in ApplicantPreferencesStep.tsx):
- Physical attributes → only for MODELS, ACTORS, DANCERS, PERFORMERS
- Professional skills → only for PHOTOGRAPHERS, VIDEOGRAPHERS, etc.
- Equipment → only for PHOTOGRAPHERS, VIDEOGRAPHERS, PRODUCTION_CREW
- Software → only for PHOTOGRAPHERS, EDITORS, VFX_ARTISTS, DESIGNERS

#### Step 5: Moodboard & Review
**Collected**:
- `moodboardId`: UUID (optional)

**Stored in DB**: ✅ Moodboard linked via moodboards table

---

## 📋 USER PROFILE DATA AVAILABLE FOR MATCHING

**users_profile table** (59 columns total):

### Already Exists ✅
- **Identity**: display_name, handle, avatar_url, bio
- **Location**: city, country
- **Professional**:
  - years_experience ✅
  - specializations[] ✅
  - equipment_list[] ✅
  - editing_software[] ✅
  - languages[] ✅
  - hourly_rate_min, hourly_rate_max ✅
  - available_for_travel ✅
  - travel_radius_km ✅
  - has_studio, studio_name, studio_address ✅
  - typical_turnaround_days ✅
- **Physical Attributes**:
  - height_cm ✅
  - measurements ✅
  - eye_color ✅
  - hair_color ✅
  - shoe_size ✅
  - clothing_sizes ✅
  - tattoos ✅
  - piercings ✅
  - talent_categories[] ✅
- **Demographics**:
  - date_of_birth ✅
  - age_verified, age_verified_at ✅
- **Creative**:
  - role_flags[] ✅
  - style_tags[] ✅
  - vibe_tags[] ✅
  - portfolio_url ✅
- **Verification**:
  - verified_id, phone_verified ✅
  - profile_completion_percentage ✅
- **Social**: instagram_url, tiktok_url, twitter_url, linkedin_url ✅

**Missing from users_profile**:
- ❌ Gender/pronouns
- ❌ Ethnicity (if needed for casting - may be sensitive)
- ❌ Body type categories

---

## 🎯 CURRENT MATCHMAKING ALGORITHM

**Function**: `calculate_gig_compatibility(p_profile_id UUID, p_gig_id UUID)`

**Current Scoring** (out of 100):
```sql
Base Score: 50 points (always given)
Location Match: +20 points (if user.city appears in gig.location_text)
Style Tags: +15 points (if user has any style_tags)
Role Match: +15 points (if user has 'TALENT' role)
Max: 100 points
```

**What's NOT Considered**:
- ❌ Height requirements
- ❌ Eye/hair color
- ❌ Age range
- ❌ Experience level
- ❌ Specific specializations
- ❌ Equipment requirements
- ❌ Software proficiency
- ❌ Language requirements
- ❌ Hourly rate budget matching
- ❌ Travel requirements
- ❌ Tattoos/piercings preferences
- ❌ Clothing sizes
- ❌ Portfolio requirement
- ❌ Talent category matching
- ❌ Distance-based location matching (PostGIS not used)
- ❌ Date availability conflicts

**Result**: Matchmaking gives generic 50-85% scores regardless of actual fit!

---

## 🛠️ SOLUTION: 3-Phase Implementation

### **Phase 1: Emergency Database Fix** (CRITICAL - 2 hours)

#### 1.1 Add applicant_preferences column to gigs table
```sql
-- Migration: 20251015000007_add_gig_preferences_column.sql

ALTER TABLE gigs
ADD COLUMN applicant_preferences JSONB DEFAULT '{}'::jsonb;

-- Add index for querying preferences
CREATE INDEX idx_gigs_applicant_preferences ON gigs USING gin(applicant_preferences);

-- Add budget fields while we're at it
ADD COLUMN budget_min NUMERIC,
ADD COLUMN budget_max NUMERIC,
ADD COLUMN budget_type VARCHAR(20) CHECK (budget_type IN ('hourly', 'per_project', 'per_day', 'total'));

-- Add looking_for column (already being inserted but might not exist)
ALTER TABLE gigs
ADD COLUMN IF NOT EXISTS looking_for_types TEXT[];

-- Add index
CREATE INDEX IF NOT EXISTS idx_gigs_looking_for ON gigs USING gin(looking_for_types);

COMMENT ON COLUMN gigs.applicant_preferences IS 'JSON object storing detailed applicant preferences for matchmaking';
COMMENT ON COLUMN gigs.budget_min IS 'Minimum budget for the gig (in EUR)';
COMMENT ON COLUMN gigs.budget_max IS 'Maximum budget for the gig (in EUR)';
COMMENT ON COLUMN gigs.budget_type IS 'How budget is calculated: hourly, per_project, per_day, or total';
```

#### 1.2 Update gig forms to include budget fields
- Add budget input to BasicDetailsStep (when comp_type = 'PAID')
- Add budget_type selector (hourly/project/day/total)
- Show conditional budget fields in UI

#### 1.3 Test data integrity
- Create test gig with full preferences
- Verify preferences are saved correctly
- Verify preferences load correctly on edit

**Estimated Time**: 2 hours
**Priority**: 🔴 CRITICAL

---

### **Phase 2: Enhanced Matchmaking Algorithm** (HIGH PRIORITY - 6-8 hours)

#### 2.1 Rewrite `calculate_gig_compatibility` function

**New Scoring System** (out of 100):

```sql
-- =========================================
-- ENHANCED GIG COMPATIBILITY SCORING
-- =========================================
CREATE OR REPLACE FUNCTION calculate_gig_compatibility_v2(
    p_profile_id UUID,
    p_gig_id UUID
) RETURNS TABLE (
    score DECIMAL(5,2),
    breakdown JSONB,
    match_details JSONB
) AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_breakdown JSONB := '{}';
    v_match_details JSONB := '{}';
    v_profile RECORD;
    v_gig RECORD;
    v_prefs JSONB;
    v_age INTEGER;
BEGIN
    -- Fetch full profile data
    SELECT * INTO v_profile
    FROM users_profile
    WHERE user_id = p_profile_id;

    -- Fetch full gig data including preferences
    SELECT * INTO v_gig
    FROM gigs
    WHERE id = p_gig_id;

    IF v_profile IS NULL OR v_gig IS NULL THEN
        RETURN QUERY SELECT 0.0::DECIMAL(5,2), '{}'::JSONB, '{}'::JSONB;
        RETURN;
    END IF;

    v_prefs := COALESCE(v_gig.applicant_preferences, '{}'::jsonb);

    -- =============================================
    -- 1. ROLE MATCHING (20 points) - CRITICAL
    -- =============================================
    IF v_gig.looking_for_types IS NOT NULL AND array_length(v_gig.looking_for_types, 1) > 0 THEN
        -- Check if user's role_flags overlap with gig's looking_for_types
        IF v_profile.role_flags && v_gig.looking_for_types THEN
            v_score := v_score + 20.0;
            v_breakdown := v_breakdown || jsonb_build_object('role_match', 20.0);
            v_match_details := v_match_details || jsonb_build_object('role_matched', true);
        ELSE
            v_breakdown := v_breakdown || jsonb_build_object('role_match', 0.0);
            v_match_details := v_match_details || jsonb_build_object('role_matched', false);
        END IF;
    ELSE
        -- No specific roles required, give partial points
        v_score := v_score + 10.0;
        v_breakdown := v_breakdown || jsonb_build_object('role_match', 10.0);
    END IF;

    -- =============================================
    -- 2. PHYSICAL ATTRIBUTES (15 points total)
    -- =============================================
    DECLARE
        v_physical_score DECIMAL(5,2) := 0;
        v_physical_max DECIMAL(5,2) := 15.0;
        v_physical_checks INTEGER := 0;
        v_physical_passed INTEGER := 0;
    BEGIN
        -- Height (5 points)
        IF (v_prefs->'physical'->'height_range'->'min') IS NOT NULL
            OR (v_prefs->'physical'->'height_range'->'max') IS NOT NULL THEN
            v_physical_checks := v_physical_checks + 1;
            IF v_profile.height_cm IS NOT NULL THEN
                IF ((v_prefs->'physical'->'height_range'->>'min')::int IS NULL
                     OR v_profile.height_cm >= (v_prefs->'physical'->'height_range'->>'min')::int)
                    AND ((v_prefs->'physical'->'height_range'->>'max')::int IS NULL
                     OR v_profile.height_cm <= (v_prefs->'physical'->'height_range'->>'max')::int) THEN
                    v_physical_passed := v_physical_passed + 1;
                    v_physical_score := v_physical_score + 5.0;
                END IF;
            END IF;
        END IF;

        -- Eye Color (3 points)
        IF jsonb_array_length(COALESCE(v_prefs->'physical'->'eye_color'->'preferred', '[]'::jsonb)) > 0 THEN
            v_physical_checks := v_physical_checks + 1;
            IF v_profile.eye_color = ANY(
                SELECT jsonb_array_elements_text(v_prefs->'physical'->'eye_color'->'preferred')
            ) THEN
                v_physical_passed := v_physical_passed + 1;
                v_physical_score := v_physical_score + 3.0;
            END IF;
        END IF;

        -- Hair Color (3 points)
        IF jsonb_array_length(COALESCE(v_prefs->'physical'->'hair_color'->'preferred', '[]'::jsonb)) > 0 THEN
            v_physical_checks := v_physical_checks + 1;
            IF v_profile.hair_color = ANY(
                SELECT jsonb_array_elements_text(v_prefs->'physical'->'hair_color'->'preferred')
            ) THEN
                v_physical_passed := v_physical_passed + 1;
                v_physical_score := v_physical_score + 3.0;
            END IF;
        END IF;

        -- Tattoos (2 points)
        IF (v_prefs->'physical'->'tattoos'->>'allowed')::boolean = false THEN
            v_physical_checks := v_physical_checks + 1;
            IF NOT COALESCE(v_profile.tattoos, false) THEN
                v_physical_passed := v_physical_passed + 1;
                v_physical_score := v_physical_score + 2.0;
            END IF;
        ELSIF (v_prefs->'physical'->'tattoos'->>'required')::boolean = true THEN
            v_physical_checks := v_physical_checks + 1;
            IF COALESCE(v_profile.tattoos, false) THEN
                v_physical_passed := v_physical_passed + 1;
                v_physical_score := v_physical_score + 2.0;
            END IF;
        END IF;

        -- Piercings (2 points)
        IF (v_prefs->'physical'->'piercings'->>'allowed')::boolean = false THEN
            v_physical_checks := v_physical_checks + 1;
            IF NOT COALESCE(v_profile.piercings, false) THEN
                v_physical_passed := v_physical_passed + 1;
                v_physical_score := v_physical_score + 2.0;
            END IF;
        ELSIF (v_prefs->'physical'->'piercings'->>'required')::boolean = true THEN
            v_physical_checks := v_physical_checks + 1;
            IF COALESCE(v_profile.piercings, false) THEN
                v_physical_passed := v_physical_passed + 1;
                v_physical_score := v_physical_score + 2.0;
            END IF;
        END IF;

        -- If no physical checks were specified, give full points
        IF v_physical_checks = 0 THEN
            v_physical_score := v_physical_max;
        END IF;

        v_score := v_score + v_physical_score;
        v_breakdown := v_breakdown || jsonb_build_object('physical_attributes', v_physical_score);
        v_match_details := v_match_details || jsonb_build_object(
            'physical_checks', v_physical_checks,
            'physical_passed', v_physical_passed
        );
    END;

    -- =============================================
    -- 3. PROFESSIONAL REQUIREMENTS (20 points total)
    -- =============================================
    DECLARE
        v_prof_score DECIMAL(5,2) := 0;
    BEGIN
        -- Experience (7 points)
        IF (v_prefs->'professional'->'experience_years'->'min') IS NOT NULL THEN
            IF v_profile.years_experience >= (v_prefs->'professional'->'experience_years'->>'min')::int THEN
                v_prof_score := v_prof_score + 7.0;
            END IF;
        ELSE
            v_prof_score := v_prof_score + 3.5; -- Partial points if no requirement
        END IF;

        -- Required Specializations (8 points)
        DECLARE
            v_req_specs JSONB := COALESCE(v_prefs->'professional'->'specializations'->'required', '[]'::jsonb);
            v_req_count INTEGER := jsonb_array_length(v_req_specs);
            v_matched_count INTEGER := 0;
        BEGIN
            IF v_req_count > 0 THEN
                -- Count how many required specializations the user has
                SELECT COUNT(*) INTO v_matched_count
                FROM jsonb_array_elements_text(v_req_specs) AS req_spec
                WHERE req_spec = ANY(v_profile.specializations);

                -- Award points proportionally
                v_prof_score := v_prof_score + (8.0 * v_matched_count / v_req_count);
            ELSE
                v_prof_score := v_prof_score + 4.0; -- Partial points if no requirement
            END IF;
        END;

        -- Portfolio Required (5 points)
        IF (v_prefs->'professional'->>'portfolio_required')::boolean = true THEN
            IF v_profile.portfolio_url IS NOT NULL AND v_profile.portfolio_url != '' THEN
                v_prof_score := v_prof_score + 5.0;
            END IF;
        ELSE
            v_prof_score := v_prof_score + 2.5; -- Partial points if not required
        END IF;

        v_score := v_score + v_prof_score;
        v_breakdown := v_breakdown || jsonb_build_object('professional', v_prof_score);
    END;

    -- =============================================
    -- 4. EQUIPMENT & SOFTWARE (10 points total)
    -- =============================================
    DECLARE
        v_eq_soft_score DECIMAL(5,2) := 0;
        v_req_equipment JSONB := COALESCE(v_prefs->'professional'->'equipment'->'required', '[]'::jsonb);
        v_req_software JSONB := COALESCE(v_prefs->'professional'->'software'->'required', '[]'::jsonb);
        v_eq_count INTEGER := jsonb_array_length(v_req_equipment);
        v_soft_count INTEGER := jsonb_array_length(v_req_software);
        v_eq_matched INTEGER := 0;
        v_soft_matched INTEGER := 0;
    BEGIN
        -- Required Equipment (5 points)
        IF v_eq_count > 0 THEN
            SELECT COUNT(*) INTO v_eq_matched
            FROM jsonb_array_elements_text(v_req_equipment) AS req_eq
            WHERE req_eq = ANY(v_profile.equipment_list);

            v_eq_soft_score := v_eq_soft_score + (5.0 * v_eq_matched / v_eq_count);
        ELSE
            v_eq_soft_score := v_eq_soft_score + 2.5;
        END IF;

        -- Required Software (5 points)
        IF v_soft_count > 0 THEN
            SELECT COUNT(*) INTO v_soft_matched
            FROM jsonb_array_elements_text(v_req_software) AS req_soft
            WHERE req_soft = ANY(v_profile.editing_software);

            v_eq_soft_score := v_eq_soft_score + (5.0 * v_soft_matched / v_soft_count);
        ELSE
            v_eq_soft_score := v_eq_soft_score + 2.5;
        END IF;

        v_score := v_score + v_eq_soft_score;
        v_breakdown := v_breakdown || jsonb_build_object('equipment_software', v_eq_soft_score);
    END;

    -- =============================================
    -- 5. LOCATION MATCHING (15 points)
    -- =============================================
    DECLARE
        v_location_score DECIMAL(5,2) := 0;
    BEGIN
        -- Exact city match (10 points)
        IF v_profile.city IS NOT NULL AND v_gig.city IS NOT NULL THEN
            IF LOWER(v_profile.city) = LOWER(v_gig.city) THEN
                v_location_score := v_location_score + 10.0;
            -- Country match (5 points)
            ELSIF v_profile.country IS NOT NULL AND v_gig.country IS NOT NULL
                AND LOWER(v_profile.country) = LOWER(v_gig.country) THEN
                v_location_score := v_location_score + 5.0;
            END IF;
        END IF;

        -- Travel willingness bonus (5 points)
        IF (v_prefs->'availability'->>'travel_required')::boolean = true THEN
            IF COALESCE(v_profile.available_for_travel, false) THEN
                v_location_score := v_location_score + 5.0;
            END IF;
        ELSE
            v_location_score := v_location_score + 2.5; -- Partial if not required
        END IF;

        v_score := v_score + v_location_score;
        v_breakdown := v_breakdown || jsonb_build_object('location', v_location_score);
    END;

    -- =============================================
    -- 6. BUDGET/RATE MATCHING (10 points)
    -- =============================================
    DECLARE
        v_budget_score DECIMAL(5,2) := 0;
        v_gig_budget_min NUMERIC := v_gig.budget_min;
        v_gig_budget_max NUMERIC := v_gig.budget_max;
        v_pref_rate_min NUMERIC := (v_prefs->'availability'->'hourly_rate_range'->>'min')::numeric;
        v_pref_rate_max NUMERIC := (v_prefs->'availability'->'hourly_rate_range'->>'max')::numeric;
    BEGIN
        -- If gig has budget and user has rate, check overlap
        IF v_gig_budget_min IS NOT NULL AND v_profile.hourly_rate_min IS NOT NULL THEN
            -- Check if ranges overlap
            IF (v_profile.hourly_rate_min <= COALESCE(v_gig_budget_max, v_gig_budget_min))
                AND (v_profile.hourly_rate_max >= v_gig_budget_min) THEN
                -- Perfect overlap
                v_budget_score := 10.0;
            ELSIF v_profile.hourly_rate_min <= v_gig_budget_min * 1.2 THEN
                -- Within 20% tolerance
                v_budget_score := 5.0;
            END IF;
        ELSE
            -- No budget info, give neutral score
            v_budget_score := 5.0;
        END IF;

        v_score := v_score + v_budget_score;
        v_breakdown := v_breakdown || jsonb_build_object('budget_rate', v_budget_score);
    END;

    -- =============================================
    -- 7. LANGUAGES (5 points)
    -- =============================================
    DECLARE
        v_lang_score DECIMAL(5,2) := 0;
        v_req_langs JSONB := COALESCE(v_prefs->'other'->'languages'->'required', '[]'::jsonb);
        v_lang_count INTEGER := jsonb_array_length(v_req_langs);
        v_lang_matched INTEGER := 0;
    BEGIN
        IF v_lang_count > 0 THEN
            SELECT COUNT(*) INTO v_lang_matched
            FROM jsonb_array_elements_text(v_req_langs) AS req_lang
            WHERE req_lang = ANY(v_profile.languages);

            v_lang_score := 5.0 * v_lang_matched / v_lang_count;
        ELSE
            v_lang_score := 2.5;
        END IF;

        v_score := v_score + v_lang_score;
        v_breakdown := v_breakdown || jsonb_build_object('languages', v_lang_score);
    END;

    -- =============================================
    -- 8. AGE RANGE (5 points)
    -- =============================================
    DECLARE
        v_age_score DECIMAL(5,2) := 0;
        v_min_age INTEGER := (v_prefs->'other'->'age_range'->>'min')::int;
        v_max_age INTEGER := (v_prefs->'other'->'age_range'->>'max')::int;
    BEGIN
        IF v_profile.date_of_birth IS NOT NULL THEN
            v_age := EXTRACT(YEAR FROM AGE(v_profile.date_of_birth));

            IF v_min_age IS NOT NULL OR v_max_age IS NOT NULL THEN
                IF (v_min_age IS NULL OR v_age >= v_min_age)
                    AND (v_max_age IS NULL OR v_age <= v_max_age) THEN
                    v_age_score := 5.0;
                END IF;
            ELSE
                v_age_score := 2.5; -- No age requirement
            END IF;
        ELSE
            v_age_score := 0.0; -- No DOB, can't verify
        END IF;

        v_score := v_score + v_age_score;
        v_breakdown := v_breakdown || jsonb_build_object('age_range', v_age_score);
    END;

    -- Cap score at 100
    IF v_score > 100 THEN
        v_score := 100.0;
    END IF;

    RETURN QUERY SELECT v_score, v_breakdown, v_match_details;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;
```

**New Scoring Breakdown** (100 points total):
- **Role Matching**: 20 points (CRITICAL - does user match what gig is looking for?)
- **Physical Attributes**: 15 points (height, eye/hair color, tattoos, piercings)
- **Professional Requirements**: 20 points (experience, specializations, portfolio)
- **Equipment & Software**: 10 points (required tools and software)
- **Location**: 15 points (city match, country match, travel willingness)
- **Budget/Rate**: 10 points (gig budget overlaps with user rate)
- **Languages**: 5 points (required languages)
- **Age Range**: 5 points (age within specified range)

**Estimated Time**: 4 hours
**Priority**: 🟠 HIGH

#### 2.2 Update `get_user_gig_recommendations` function
- Use new compatibility scoring
- Add filter parameters (comp_types, budget_range, style_tags, max_distance)
- Return additional fields (city, style_tags, deadline, applicant_count)
- Order by compatibility AND recency

**Estimated Time**: 2 hours

---

### **Phase 3: Advanced Features** (NICE-TO-HAVE - 8-10 hours)

#### 3.1 PostGIS Distance-Based Matching
- Add `location` geography column to users_profile (if not exists)
- Use `ST_DWithin` for radius-based search
- Add distance to return results

#### 3.2 Calendar Conflict Detection
- Check user's accepted applications for date overlap
- Reduce compatibility score if conflict exists

#### 3.3 Specialization Weighting
- Some specializations more valuable than others
- Adjust scoring based on rarity/demand

#### 3.4 Style Tags Similarity
- Calculate Jaccard similarity for style_tags
- Weight by tag importance

#### 3.5 Verification Boosts
- Bonus points for verified_id
- Bonus points for phone_verified
- Bonus for high profile_completion_percentage

**Estimated Time**: 8-10 hours
**Priority**: 🟢 LOW

---

## 📝 TESTING CHECKLIST

### Phase 1 Tests
- [ ] Create gig with full preferences → preferences saved to DB
- [ ] Edit gig → preferences loaded correctly
- [ ] Create gig with partial preferences → no errors
- [ ] Create gig without preferences → works normally
- [ ] Budget fields save/load correctly

### Phase 2 Tests
- [ ] User matching all criteria → 90-100% score
- [ ] User matching some criteria → 50-70% score
- [ ] User matching no criteria → 10-30% score
- [ ] Role mismatch → very low score
- [ ] Budget mismatch → reduced score
- [ ] Location exact match → bonus points
- [ ] Location country match → partial points
- [ ] Physical attributes match → correct scoring
- [ ] Experience too low → score penalty
- [ ] Missing required equipment → score penalty
- [ ] Language mismatch → score penalty

### Phase 3 Tests
- [ ] Distance-based filtering works
- [ ] Calendar conflicts detected
- [ ] Verification bonuses applied
- [ ] Performance acceptable with 1000+ gigs

---

## 🚀 DEPLOYMENT PLAN

### Step 1: Database Migration (Phase 1)
```bash
# Run migration
supabase db push

# Verify column exists
psql -c "\d gigs"

# Test insert
psql -c "INSERT INTO gigs (..., applicant_preferences) VALUES (..., '{\"physical\": {}}');"
```

### Step 2: Code Updates
```bash
# No changes needed to gig create page (already sends preferences!)
# Update gig edit page to load/save preferences
# Update matchmaking components to show new breakdown
```

### Step 3: Function Deployment (Phase 2)
```bash
# Deploy new compatibility function
supabase db push

# Test function
psql -c "SELECT * FROM calculate_gig_compatibility_v2('user-id', 'gig-id');"
```

### Step 4: User Communication
- Announce matchmaking improvements
- Explain new scoring system
- Encourage users to fill out preferences

---

## 📊 ESTIMATED IMPACT

### Before Fix:
- ❌ Preferences collected but not saved
- ❌ Generic 50-85% compatibility scores
- ❌ Poor match quality
- ❌ Users waste time applying to mismatched gigs

### After Fix:
- ✅ All preferences saved and used
- ✅ Accurate 0-100% compatibility scores
- ✅ High-quality matches (85%+ score = excellent fit)
- ✅ Users find relevant opportunities
- ✅ Contributors get better applicants
- ✅ Time saved for everyone

---

## ⏱️ TOTAL TIME ESTIMATE

- **Phase 1** (Critical): 2 hours
- **Phase 2** (High): 6-8 hours
- **Phase 3** (Low): 8-10 hours

**Total**: 16-20 hours (2-3 days full-time)

**Recommended**: Start with Phase 1 immediately (2 hours), then Phase 2 within 1 week.

---

## 🔍 TREATMENTS & COLLABS ANALYSIS

**TODO**: Check if treatments and collabs have similar preference collection flows that might also be broken.

**Next Steps**:
1. Search for treatment creation flow
2. Search for collab creation flow
3. Check if they collect preferences
4. Verify if those preferences are stored

---

## 📚 FILES TO MODIFY

### Phase 1:
- `supabase/migrations/20251015000007_add_gig_preferences_column.sql` (NEW)
- `apps/web/app/components/gig-edit-steps/BasicDetailsStep.tsx` (add budget fields)
- `apps/web/lib/gig-form-persistence.ts` (add budget to types)

### Phase 2:
- `supabase/migrations/20251015000008_enhanced_matchmaking_v2.sql` (NEW)
- `apps/web/lib/types/matchmaking.ts` (update types)
- `apps/web/app/components/matchmaking/CompatibilityScore.tsx` (show new breakdown)
- `apps/web/lib/hooks/useCompatibility.tsx` (use v2 function)

### Phase 3:
- `supabase/migrations/20251015000009_advanced_matchmaking.sql` (NEW)
- Various matchmaking UI components

---

## 🎉 CONCLUSION

This is a **MAJOR BUG** affecting every gig created. Users think they're setting detailed matchmaking preferences, but those preferences are being silently discarded.

**The fix is straightforward**: Add the missing database column, and the existing code will immediately start working!

**Bonus**: Once preferences are saved, we can dramatically improve matchmaking quality by using all that rich preference data in the compatibility algorithm.

**Priority**: 🔴 **CRITICAL** - Fix Phase 1 ASAP!
