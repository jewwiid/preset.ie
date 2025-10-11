# Supabase Setup Steps - "Looking For" & Matchmaking Improvements

## 📋 Quick Checklist

- [ ] Step 1: Apply database migration
- [ ] Step 2: Verify migration worked
- [ ] Step 3: Test helper functions
- [ ] Step 4: Update Urban Fashion gig manually (optional)
- [ ] Step 5: Verify Zara's match improves

---

## Step 1: Apply the Migration ✅

**File Ready**: `supabase/migrations/108_add_looking_for_to_gigs.sql`

### Run this command:

```bash
npx supabase db push
```

### What it does:
- ✅ Adds `looking_for_types TEXT[]` column to `gigs` table
- ✅ Creates GIN index for fast array queries
- ✅ Migrates existing gigs intelligently:
  - "Urban Fashion" gig → `['MODELS']` (has "model" in title/description)
  - Other gigs → Smart detection based on keywords
- ✅ Creates 2 helper functions:
  - `gig_is_looking_for()` - Check if gig wants specific role
  - `user_matches_gig_types()` - Check if user matches gig
- ✅ Adds validation (max 10 types per gig)

---

## Step 2: Verify Migration Worked ✅

### Check the column was added:

```sql
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'gigs' 
  AND column_name = 'looking_for_types';
```

**Expected Output**:
```
column_name        | data_type    | column_default | is_nullable
-------------------|--------------|----------------|------------
looking_for_types  | ARRAY        | '{}'::text[]   | YES
```

### Check existing gigs were migrated:

```sql
SELECT 
  title,
  looking_for_types,
  created_at
FROM gigs
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Output** (for Urban Fashion gig):
```
title                                    | looking_for_types
-----------------------------------------|-------------------
Urban Fashion — Golden Hour Editorial   | {MODELS}
```

---

## Step 3: Test Helper Functions ✅

### Test 1: Check if gig is looking for models

```sql
SELECT gig_is_looking_for(ARRAY['MODELS', 'MAKEUP_ARTISTS'], 'MODELS');
```

**Expected**: `true`

### Test 2: Check if gig is looking for photographers

```sql
SELECT gig_is_looking_for(ARRAY['MODELS', 'MAKEUP_ARTISTS'], 'PHOTOGRAPHERS');
```

**Expected**: `false`

### Test 3: Check if Zara matches the Urban Fashion gig

```sql
SELECT user_matches_gig_types(
  'Model',                              -- Zara's primary role
  ARRAY['Fashion Model', 'Editorial'],  -- Zara's categories
  (SELECT looking_for_types FROM gigs WHERE title ILIKE '%Urban Fashion%')
);
```

**Expected**: `true`

---

## Step 4: Manually Update Urban Fashion Gig (Optional)

If the automatic migration didn't set it correctly, manually update:

```sql
UPDATE gigs
SET looking_for_types = ARRAY['MODELS']
WHERE title ILIKE '%Urban Fashion%';
```

### Verify:

```sql
SELECT 
  title,
  looking_for_types,
  applicant_preferences
FROM gigs
WHERE title ILIKE '%Urban Fashion%';
```

---

## Step 5: Verify Zara's Match Score (After Matchmaking Update)

**Note**: This requires the matchmaking algorithm to be updated first!

### Current State (Without Role Matching):
```
Zara Ahmed → 61% Good Match
```

### Expected After Role Matching:
```
Zara Ahmed → 85-95% Excellent Match
(40 points for perfect role match + existing criteria)
```

---

## 🔍 Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution**: The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to re-run. If it still fails:

```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'gigs' 
  AND column_name = 'looking_for_types';

-- If exists but is wrong type, drop and recreate
ALTER TABLE gigs DROP COLUMN IF EXISTS looking_for_types;
ALTER TABLE gigs ADD COLUMN looking_for_types TEXT[] DEFAULT '{}';
```

### Issue: Gigs not migrated to correct types

**Solution**: Run the UPDATE statement manually:

```sql
UPDATE gigs
SET looking_for_types = 
  CASE 
    WHEN title ILIKE '%model%' OR description ILIKE '%model%' 
      THEN ARRAY['MODELS']
    WHEN title ILIKE '%photographer%' 
      THEN ARRAY['PHOTOGRAPHERS']
    -- ... etc
    ELSE ARRAY['OTHER']
  END
WHERE looking_for_types = '{}';
```

### Issue: Index not created

**Solution**:

```sql
CREATE INDEX IF NOT EXISTS idx_gigs_looking_for_types
ON gigs USING GIN (looking_for_types);
```

---

## 📊 Verification Queries

### Check all gigs and their types:

```sql
SELECT 
  id,
  title,
  looking_for_types,
  status,
  created_at
FROM gigs
ORDER BY created_at DESC;
```

### Count gigs by type:

```sql
SELECT 
  unnest(looking_for_types) as role_type,
  COUNT(*) as gig_count
FROM gigs
WHERE looking_for_types IS NOT NULL 
  AND looking_for_types != '{}'
GROUP BY role_type
ORDER BY gig_count DESC;
```

### Find all gigs looking for models:

```sql
SELECT 
  title,
  looking_for_types,
  location_text,
  status
FROM gigs
WHERE 'MODELS' = ANY(looking_for_types)
  AND status = 'PUBLISHED';
```

---

## ⚡ Quick Test Script

Run this all-in-one verification script:

```sql
-- Comprehensive verification
DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_index_exists BOOLEAN;
  v_gig_count INTEGER;
BEGIN
  -- Check column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'looking_for_types'
  ) INTO v_column_exists;
  
  -- Check index
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'gigs' AND indexname = 'idx_gigs_looking_for_types'
  ) INTO v_index_exists;
  
  -- Count migrated gigs
  SELECT COUNT(*) INTO v_gig_count
  FROM gigs
  WHERE looking_for_types IS NOT NULL AND looking_for_types != '{}';
  
  -- Output results
  RAISE NOTICE '============================================';
  RAISE NOTICE 'LOOKING FOR TYPES - MIGRATION VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Column exists: %', v_column_exists;
  RAISE NOTICE 'Index exists: %', v_index_exists;
  RAISE NOTICE 'Gigs migrated: % out of %', v_gig_count, (SELECT COUNT(*) FROM gigs);
  RAISE NOTICE '============================================';
  
  IF v_column_exists AND v_index_exists THEN
    RAISE NOTICE '✅ Migration successful!';
  ELSE
    RAISE NOTICE '❌ Migration incomplete - check above';
  END IF;
END $$;
```

---

## 🎯 Expected Timeline

### Today (10 minutes):
1. Run `npx supabase db push`
2. Run verification queries
3. Confirm Urban Fashion gig has `looking_for_types = ['MODELS']`

### Next (After UI is built):
1. Update gig creation form to include "Looking For" dropdown
2. Test creating new gig with multiple types
3. Verify data is saved correctly

### Later (Week 2-3):
1. Implement enhanced matchmaking algorithm
2. See Zara's score jump from 61% → 90%+
3. Deploy to production

---

## 🚀 Next Steps After Supabase

Once the database is ready, you'll need to:

1. ✅ Update `BasicDetailsStep.tsx` - Add "Looking For" multi-select
2. ✅ Update `ApplicantPreferencesStep.tsx` - Conditional display
3. ✅ Update create/edit page logic - Handle array data
4. ✅ Update matchmaking algorithm - Use role matching
5. ✅ Update UI components - Show role badges

But for now, **just run the migration and verify it works!**

---

## 📝 Summary

**Command to run**: 
```bash
npx supabase db push
```

**What you're adding**:
- `looking_for_types TEXT[]` column
- GIN index for performance
- 2 helper functions
- Intelligent migration of existing gigs

**Verification**:
```sql
SELECT title, looking_for_types FROM gigs;
```

**Expected for Urban Fashion gig**:
```
{MODELS}
```

That's it for Supabase! Run the command and let me know if you see any errors. 🚀

