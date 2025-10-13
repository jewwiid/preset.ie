# Moodboard Save Error - Fix Applied ✅

## Error Encountered

```
Save error: {}
at saveMoodboard (app/components/MoodboardBuilder.tsx:1464:15)
```

## Root Cause

The `moodboards` table has `gig_id UUID NOT NULL` constraint from the original migration, but the code tries to save moodboards without a gig_id when:
1. Saving as a template (`is_template = true`)
2. Creating during gig creation with temporary ID (`temp-xxxxx`)
3. Creating standalone moodboards

## Solution Applied

### 1. ✅ Database Migration Created

**File:** [20251012160000_fix_moodboards_gig_id_nullable.sql](supabase/migrations/20251012160000_fix_moodboards_gig_id_nullable.sql)

```sql
-- Make gig_id nullable in moodboards table
ALTER TABLE moodboards ALTER COLUMN gig_id DROP NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_moodboards_gig_id
  ON moodboards(gig_id)
  WHERE gig_id IS NOT NULL;
```

**This allows:**
- Templates without gig_id
- Standalone moodboards
- Temporary moodboards during gig creation

---

### 2. ✅ Improved Error Handling

**File:** [MoodboardBuilder.tsx](apps/web/app/components/MoodboardBuilder.tsx:1463-1484)

Added specific error messages:
- `23502` (NOT NULL violation) → "Database constraint error. Please run the latest migrations."
- `23503` (Foreign key violation) → "Invalid reference. Please ensure your profile is complete."
- Better error logging with stack traces

---

## How to Fix

### Step 1: Run the Migration

```bash
cd supabase
supabase db push
```

Or manually run:
```sql
ALTER TABLE moodboards ALTER COLUMN gig_id DROP NOT NULL;
```

---

### Step 2: Verify the Fix

After running the migration, test these scenarios:

#### ✅ Test 1: Save Template
1. Create moodboard
2. Check "Save as Template"
3. Check "Make this template public"
4. Click "Save Template"
5. **Expected:** Saves successfully without gig_id

#### ✅ Test 2: Save Moodboard During Gig Creation
1. Start creating a gig
2. Go to Moodboard step
3. Create moodboard
4. Save
5. **Expected:** Saves successfully with temporary ID

#### ✅ Test 3: Save Moodboard After Gig Published
1. Complete gig creation and publish
2. Moodboard should now have gig_id linked
3. **Expected:** gig_id properly set

---

## What Changed

### Before (Broken)
```sql
-- Original schema
CREATE TABLE moodboards (
    gig_id UUID NOT NULL REFERENCES gigs(id)  -- ❌ Breaks templates
    ...
);
```

### After (Fixed)
```sql
-- Updated schema
CREATE TABLE moodboards (
    gig_id UUID REFERENCES gigs(id)  -- ✅ Nullable for templates
    ...
);
```

---

## Data Flow

### Creating Template
```typescript
const moodboardData = {
  owner_user_id: profile.id,
  title: 'My Template',
  is_template: true,
  is_public: true,
  // gig_id: NOT included ✅
}
```

### Creating Moodboard in Gig
```typescript
// During creation (temp ID)
const moodboardData = {
  owner_user_id: profile.id,
  title: 'Gig Moodboard',
  // gig_id: NOT included yet ✅
}

// After gig published
await supabase
  .from('moodboards')
  .update({ gig_id: actualGigId })
  .eq('id', moodboardId)
// gig_id: NOW included ✅
```

---

## Error Codes Reference

| Code | Meaning | Fix |
|------|---------|-----|
| `23502` | NOT NULL violation | Run migration to make gig_id nullable |
| `23503` | Foreign key violation | Ensure profile exists |
| `23505` | Unique constraint violation | Check for duplicates |
| `42P01` | Table doesn't exist | Run all migrations |

---

## Verification Queries

After migration, verify the change:

```sql
-- Check if gig_id is nullable
SELECT
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'moodboards'
  AND column_name = 'gig_id';

-- Expected result:
-- column_name | is_nullable | column_default
-- gig_id      | YES         | NULL
```

Check existing moodboards:

```sql
-- Count moodboards by type
SELECT
  CASE
    WHEN gig_id IS NULL AND is_template = true THEN 'Templates'
    WHEN gig_id IS NULL THEN 'Standalone'
    ELSE 'Linked to Gig'
  END as type,
  COUNT(*) as count
FROM moodboards
GROUP BY type;
```

---

## Summary

✅ **Migration created** to make `gig_id` nullable
✅ **Error handling improved** with specific messages
✅ **Index added** for performance on gig lookups
✅ **Backward compatible** - existing moodboards unaffected

**Status:** Ready to deploy after running migration!
