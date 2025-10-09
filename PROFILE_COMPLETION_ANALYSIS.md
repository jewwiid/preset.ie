# Profile Completion Calculation Discrepancy Analysis

## Summary
Different pages show different completion percentages for James Murphy:
- **Database (current)**: 64%
- **Frontend ProfileCompletionCard**: 18% → 32%
- **Dashboard Smart Suggestions**: Uses database value (64%)

## Root Cause

There are **THREE different calculation methods**:

### 1. Database Trigger Function (`calculate_profile_completion`)
**Location**: `supabase/migrations/full.sql` (lines 2845-2980)

**Fields Checked** (for TALENT role):
- bio (10 weight) ✓
- city (8 weight) ✓
- country (5 weight) ✓
- years_experience (12 weight) ✗
- specializations (15 weight) ✗ (empty array)
- hourly_rate_min (10 weight) ✗
- typical_turnaround_days (6 weight) ✗
- phone_number (5 weight) ✗
- portfolio_url (8 weight) ✗
- website_url (5 weight) ✗
- instagram_handle (3 weight) ✗
- tiktok_handle (2 weight) ✗
- available_for_travel (4 weight) ✓ (false counts!)
- languages (4 weight) ✓ ["English"]

**Total Weight**: 97
**Completed**: 10 + 8 + 5 + 4 + 4 = 31
**Expected Percentage**: 31/97 = 31.9% ≈ 32%
**Actual Database**: 64%

**PROBLEM**: Database shows 64% but calculation should be 32%!

### 2. Frontend ProfileCompletionCard
**Location**: `apps/web/components/profile/sections/ProfileCompletionCard.tsx` (lines 89-139)

**Fields Checked** (same as database SHOULD check)
**Calculation**: Client-side recalculation using profile data from API

### 3. Smart Suggestions (uses database value)
**Location**: `apps/web/lib/utils/smart-suggestions.ts`
**Calculation**: Uses `profile.profile_completion_percentage` from database

## Fields Filled in Database (but NOT in calculation)

James Murphy's profile has these fields filled that are **NOT** in the completion calculation:
- `height_cm`: 180
- `eye_color`: "Blue"
- `hair_color`: "Brown"
- `tattoos`: true
- `talent_categories`: ["Actor", "Performer"]
- `date_of_birth`: "1993-09-29"
- `gender_identity`: "male"
- `ethnicity`: "white/caucasian"
- `nationality`: "Irish"
- `experience_level`: "professional"
- `availability_status`: "Busy"
- `primary_skill`: "Actor"
- `available_weekdays`: true

## Why Discrepancy Exists

**Hypothesis**: There may be ANOTHER version of `calculate_profile_completion` function in the database that includes additional fields, OR the trigger isn't being called and the percentage is being updated by application code somewhere.

## Action Items

1. ✅ Check if there are multiple versions of calculate_profile_completion function in database
2. ✅ Verify which trigger is actually being used
3. ✅ Update either the database function OR frontend calculation to match
4. ✅ Document the canonical field weights for profile completion

## Recommended Solution

**Option A**: Update database function to include talent-specific fields:
- Add `primary_skill` (15 weight)
- Add `experience_level` (12 weight) 
- Add `height_cm`, `eye_color`, `hair_color` for talent (10 weight combined)
- Add `gender_identity`, `ethnicity`, `nationality` (8 weight combined)
- Add `talent_categories` (10 weight)

**Option B**: Ensure frontend and database use EXACT same field list

## Current Status
- Database: 64% (calculated by unknown method)
- Frontend card: 32% (correct based on function)
- Mismatch is confusing users!

