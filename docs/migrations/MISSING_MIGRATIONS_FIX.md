# Missing Database Migrations - Complete Fix Guide

## Current Error

```
Could not find the 'template_description' column of 'moodboards' in the schema cache
Code: PGRST204
```

## Root Cause

Several migrations have not been applied to your database. The code is trying to use columns that don't exist yet.

---

## Required Migrations (In Order)

### 1. ✅ Moodboard Templates Support
**File:** `008b_add_moodboard_templates.sql`

Adds:
- `is_template` BOOLEAN
- `template_name` VARCHAR(255)
- `template_description` TEXT

### 2. ✅ Moodboard Public/Private Support
**File:** `007_complete_moodboard_schema.sql`

Adds:
- `is_public` BOOLEAN
- `source_breakdown` JSONB
- `enhancement_log` JSONB
- `total_cost` DECIMAL
- `generated_prompts` TEXT[]
- `ai_provider` VARCHAR(50)

### 3. ✅ Make gig_id Nullable
**File:** `20251012160000_fix_moodboards_gig_id_nullable.sql`

Changes:
- `gig_id` from `NOT NULL` to nullable

---

## Quick Fix: Run All Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
cd /Users/judeokun/Documents/GitHub/preset/preset.ie/preset
supabase db push
```

This will apply all pending migrations.

---

### Option 2: Manual SQL (If CLI not available)

Run these SQL commands in order on your database:

```sql
-- 1. Add template support
ALTER TABLE moodboards
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS template_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS template_description TEXT;

CREATE INDEX IF NOT EXISTS idx_moodboards_template
  ON moodboards(is_template, owner_user_id);

COMMENT ON COLUMN moodboards.is_template IS 'Whether this moodboard is saved as a reusable template';
COMMENT ON COLUMN moodboards.template_name IS 'Name of the template (only used when is_template = true)';
COMMENT ON COLUMN moodboards.template_description IS 'Description of the template (only used when is_template = true)';

-- 2. Add public/private support
ALTER TABLE moodboards
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_breakdown JSONB DEFAULT '{
  "pexels": 0,
  "user_uploads": 0,
  "ai_enhanced": 0,
  "ai_generated": 0
}',
ADD COLUMN IF NOT EXISTS enhancement_log JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS generated_prompts TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. Make gig_id nullable
ALTER TABLE moodboards ALTER COLUMN gig_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_moodboards_gig_id
  ON moodboards(gig_id)
  WHERE gig_id IS NOT NULL;

-- 4. Update RLS policies for public moodboards
DROP POLICY IF EXISTS "Public moodboards are viewable by everyone" ON moodboards;
CREATE POLICY "Public moodboards are viewable by everyone"
  ON moodboards
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can view their own moodboards" ON moodboards;
CREATE POLICY "Users can view their own moodboards"
  ON moodboards
  FOR SELECT
  USING (
    owner_user_id IN (
      SELECT id FROM users_profile WHERE user_id = auth.uid()
    )
  );
```

---

## Verification

After running migrations, verify the schema:

```sql
-- Check all moodboards columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'moodboards'
ORDER BY ordinal_position;
```

**Expected columns:**
- ✅ `id` UUID
- ✅ `gig_id` UUID (nullable)
- ✅ `owner_user_id` UUID (not null)
- ✅ `title` VARCHAR(255)
- ✅ `summary` TEXT
- ✅ `palette` JSONB
- ✅ `items` JSONB
- ✅ `is_template` BOOLEAN
- ✅ `template_name` VARCHAR(255)
- ✅ `template_description` TEXT
- ✅ `is_public` BOOLEAN
- ✅ `tags` TEXT[]
- ✅ `source_breakdown` JSONB
- ✅ `enhancement_log` JSONB
- ✅ `total_cost` DECIMAL
- ✅ `generated_prompts` TEXT[]
- ✅ `ai_provider` VARCHAR(50)
- ✅ `created_at` TIMESTAMPTZ
- ✅ `updated_at` TIMESTAMPTZ

---

## Test After Migration

### Test 1: Save Regular Moodboard
```typescript
// Should work now
const moodboard = {
  owner_user_id: 'uuid',
  title: 'Test',
  items: [],
  is_public: false
  // gig_id can be NULL
}
```

### Test 2: Save Template
```typescript
// Should work now
const template = {
  owner_user_id: 'uuid',
  title: 'My Template',
  is_template: true,
  template_name: 'Portrait Template',
  template_description: 'For portrait shoots',
  is_public: true,
  items: []
  // gig_id is NULL for templates
}
```

### Test 3: Save During Gig Creation
```typescript
// Should work now
const moodboard = {
  owner_user_id: 'uuid',
  title: 'Gig Moodboard',
  items: [],
  is_public: false
  // gig_id is NULL initially, set later
}
```

---

## Why This Happened

The codebase was updated to support new features, but the database wasn't migrated:

| Feature | Code Status | Database Status | Issue |
|---------|-------------|-----------------|-------|
| Templates | ✅ Implemented | ❌ Not migrated | Missing columns |
| Public/Private | ✅ Implemented | ❌ Not migrated | Missing column |
| Nullable gig_id | ✅ Implemented | ❌ Not migrated | NOT NULL constraint |

---

## After Migration

Once all migrations are applied:

✅ Moodboards can be saved
✅ Templates can be created
✅ Public/Private toggle works
✅ Standalone moodboards work
✅ Gig creation moodboards work

---

## Troubleshooting

### If migrations fail:

**Error: "column already exists"**
- Some migrations already ran
- Use `IF NOT EXISTS` clauses (shown above)

**Error: "permission denied"**
- Need admin/owner access to database
- Use superuser or service role

**Error: "relation does not exist"**
- Run earlier migrations first
- Check migration order

### Check Migration Status

```sql
-- See what's been migrated (if using Supabase migrations table)
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
```

---

## Summary

**Problem:** Database missing columns that code expects
**Solution:** Run migrations in order
**Command:** `supabase db push` or run SQL manually
**Result:** All features will work correctly

**Estimated time:** 1-2 minutes to apply migrations
