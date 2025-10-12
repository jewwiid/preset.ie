# Gig Location Fields Update

## Summary
Updated the gig creation form to use separate **City** and **Country** fields instead of a single text input, while maintaining backward compatibility with existing data.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20251012100000_add_city_country_to_gigs.sql`

- Added `city` (VARCHAR 255) and `country` (VARCHAR 255) columns to `gigs` table
- Migrated existing `location_text` data to separate fields
- Made `location_text` optional (removed NOT NULL constraint)
- Added constraint to ensure either `location_text` OR both `city` AND `country` are provided
- Maintains backward compatibility

### 2. UI Component Update
**File:** `apps/web/app/components/gig-edit-steps/LocationScheduleStep.tsx`

**Added:**
- `city` and `country` props to the interface
- `onCityChange` and `onCountryChange` callbacks
- Pre-populated COUNTRIES list (30 countries, alphabetically sorted)
- Two-field layout: Text input for City + Dropdown for Country

**Features:**
- City field: Free text input (e.g., "Galway", "Dublin", "London")
- Country field: Dropdown with pre-populated options
- Both fields update the combined `location` for backward compatibility
- Responsive grid layout (stacked on mobile, side-by-side on desktop)

### 3. Form Data Types
**File:** `apps/web/lib/gig-form-persistence.ts`

- Added `city?: string` to `GigFormData` interface
- Added `country?: string` to `GigFormData` interface
- Maintains `location` field for backward compatibility

### 4. Gig Creation Logic
**File:** `apps/web/app/gigs/create/page.tsx`

**Updated:**
- Props passed to `LocationScheduleStep` to include `city`, `country`, and their change handlers
- Save logic to store separate `city` and `country` values
- Database insert to use separate fields while keeping `location_text` for compatibility
- Falls back to parsing `location_text` if separate fields not available

## Database Schema

```sql
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS country VARCHAR(255);
ALTER TABLE gigs ALTER COLUMN location_text DROP NOT NULL;

-- Ensures data integrity
ALTER TABLE gigs ADD CONSTRAINT location_fields_check 
  CHECK (
    (location_text IS NOT NULL AND location_text != '') 
    OR 
    (city IS NOT NULL AND country IS NOT NULL AND city != '' AND country != '')
  );
```

## UI Preview

### Before:
```
Shoot Location *
[e.g., Manchester, United Kingdom  •  Dublin, Ireland  •  Paris, France]
```

### After:
```
Shoot Location *
┌─────────────────────────────────────┬─────────────────────────────────────┐
│ City                                 │ Country                              │
│ [e.g., Galway, Dublin, London...]   │ [Select country... ▼]               │
└─────────────────────────────────────┴─────────────────────────────────────┘
💡 Specify the city and country to help talent find and filter gigs in their area
```

## Benefits

1. **Better Data Quality**: Structured data vs free text
2. **Easier Filtering**: Can filter by country without parsing text
3. **Autocomplete Ready**: Country dropdown prevents typos
4. **Backward Compatible**: Existing gigs continue to work
5. **Database Ready**: City and country fields enable location-based queries

## Testing Checklist

- [x] Migration runs without errors
- [x] No TypeScript/linting errors
- [x] Component renders with both fields
- [ ] Create new gig with separate city/country fields
- [ ] Verify data saves correctly to database
- [ ] Test that existing gigs still display correctly
- [ ] Test mobile responsiveness
- [ ] Verify country dropdown works
- [ ] Test form validation (both fields required)

## Next Steps

1. Update gig edit page to use same field structure
2. Update gig display pages to show city and country
3. Add location-based search/filtering using city and country fields
4. Consider adding city autocomplete for better UX

