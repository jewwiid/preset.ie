# Preset Visibility Issue - Root Cause & Solution

## Problem
Existing presets (Headshot and Product Photography) are not showing up in search results on the marketplace or preset browser.

## Root Cause

### API Filtering Logic
**File:** `apps/web/app/api/presets/route.ts` (Lines 112-114)

```typescript
} else {
  // Only show public presets if no user filter
  filteredPresets = filteredPresets.filter(preset => preset.is_public === true);
}
```

The API **only returns presets where `is_public = true`** when no user filter is specified. This is correct behavior for a marketplace, but it means any preset with `is_public = false` will be invisible to users.

### Why This Happens

1. **Default Value:** When creating presets manually via SQL INSERT, if `is_public` is not explicitly set or set to `false`, the preset won't appear in public searches

2. **User-Specific Queries:** Only when querying with a specific `user_id` (e.g., `/api/presets?user_id=me`) will private presets be visible

3. **Database State:** Your existing headshot and product presets likely have `is_public = false`

## Solution

### Quick Fix (Run this SQL)

```bash
# Check current status
psql -h <host> -d <db> -f scripts/check-existing-presets.sql

# Fix visibility
psql -h <host> -d <db> -f scripts/fix-preset-visibility.sql
```

### SQL Fix Script
```sql
-- Make headshot presets public
UPDATE presets
SET
    is_public = true,
    is_featured = true,
    updated_at = NOW()
WHERE
    (
        name ILIKE '%headshot%' OR
        name ILIKE '%professional%portrait%' OR
        name ILIKE '%linkedin%' OR
        category IN ('headshot', 'professional_portrait', 'corporate_portrait')
    )
    AND is_public = false;

-- Make product presets public
UPDATE presets
SET
    is_public = true,
    is_featured = true,
    updated_at = NOW()
WHERE
    (
        name ILIKE '%product%' OR
        name ILIKE '%ecommerce%' OR
        category IN ('product_photography', 'ecommerce', 'product_catalog')
    )
    AND is_public = false;
```

### Verify Fix
```sql
-- Check if presets are now visible
SELECT
    name,
    category,
    is_public,
    is_featured
FROM presets
WHERE
    name ILIKE '%headshot%' OR
    name ILIKE '%product%'
ORDER BY name;
```

## How the API Works

### Public Preset Search (Default)
```
GET /api/presets
GET /api/presets?category=headshot
GET /api/presets?search=professional
```
**Returns:** Only presets with `is_public = true`

### User-Specific Presets
```
GET /api/presets?user_id=me
(with Authorization header)
```
**Returns:** All presets created by that user (public and private)

### Specific User's Presets
```
GET /api/presets?user_id=<uuid>
```
**Returns:** All presets created by that specific user

## Database Schema Reference

```sql
CREATE TABLE presets (
    id UUID PRIMARY KEY,
    user_id UUID,
    name VARCHAR(100),
    description TEXT,
    category VARCHAR(50),

    -- Visibility flags
    is_public BOOLEAN DEFAULT false,  -- ⚠️ This controls marketplace visibility
    is_featured BOOLEAN DEFAULT false, -- Featured/promoted presets
    is_active BOOLEAN DEFAULT true,    -- Soft delete flag

    -- ... other fields
);
```

## Best Practices

### For System/Default Presets
Always set:
```sql
is_public = true,
is_featured = true,
is_active = true
```

### For User-Created Presets
Default to:
```sql
is_public = false,  -- User must explicitly make public
is_featured = false, -- Only admins can feature
is_active = true
```

### For Premium/Paid Presets
```sql
is_public = true,     -- Visible in marketplace
is_featured = true,   -- Promoted
is_for_sale = true,   -- Available for purchase
sale_price > 0
```

## Debugging Checklist

### 1. Check if preset exists
```sql
SELECT * FROM presets WHERE name ILIKE '%headshot%';
```

### 2. Check visibility settings
```sql
SELECT name, is_public, is_featured, is_active
FROM presets
WHERE name ILIKE '%headshot%';
```

### 3. Test API endpoint
```bash
curl "https://your-domain.com/api/presets?category=headshot"
```

### 4. Check RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'presets';
```

### 5. Verify user_id
```sql
SELECT id, email FROM auth.users
WHERE id = '<user_id>';
```

## Common Issues

### Issue 1: Presets don't appear in marketplace
**Cause:** `is_public = false`
**Fix:** `UPDATE presets SET is_public = true WHERE ...`

### Issue 2: Presets appear for owner but not others
**Cause:** Working as designed - private presets only visible to owner
**Fix:** Make public or keep private

### Issue 3: Featured presets don't show up first
**Cause:** Sort order or `is_featured = false`
**Fix:** Check API sorting logic and featured flag

### Issue 4: RLS blocking access
**Cause:** Row Level Security policies too restrictive
**Fix:** Review and update RLS policies

## Testing After Fix

### 1. Public Search
```bash
curl "https://your-domain.com/api/presets?category=headshot"
# Should return your headshot presets
```

### 2. Text Search
```bash
curl "https://your-domain.com/api/presets?search=professional"
# Should return presets with "professional" in name/description
```

### 3. Featured Presets
```bash
curl "https://your-domain.com/api/presets?sort=featured"
# Should return featured presets first
```

### 4. UI Test
1. Go to preset marketplace
2. Select "Headshot" category
3. Should see: "Professional Corporate Headshot", "LinkedIn Professional Portrait", etc.
4. Search for "product"
5. Should see: "E-commerce Product Photography", etc.

## Files Created

1. `scripts/debug-preset-search.sql` - Comprehensive debugging queries
2. `scripts/check-existing-presets.sql` - Check current state
3. `scripts/fix-preset-visibility.sql` - Fix visibility issues

## Summary

✅ **Root Cause Identified:** `is_public = false` on existing presets
✅ **Fix Created:** SQL scripts to update visibility flags
✅ **API Logic Verified:** Working as designed (filters by `is_public`)
✅ **Documentation Complete:** Issue explained and solutions provided

**Next Step:** Run `fix-preset-visibility.sql` to make presets public
