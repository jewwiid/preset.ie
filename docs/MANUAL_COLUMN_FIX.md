# Manual Fix for date_of_birth Column Error

## Issue
The frontend is throwing an error: `column users_profile.date_of_birth does not exist`

## Root Cause
The `users_profile` table is missing the `date_of_birth` column that the application code expects.

## Quick Fix (Supabase Dashboard)

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Navigate to your project

2. **Access Database**
   - Click on "Database" in the left sidebar
   - Click on "Tables"
   - Find and click on the `users_profile` table

3. **Add Column**
   - Click the "Add Column" button
   - Fill in the details:
     - **Name**: `date_of_birth`
     - **Type**: `date`
     - **Nullable**: ✓ (checked)
     - **Default**: leave empty

4. **Save**
   - Click "Save" to add the column

## Alternative Fix (SQL Editor)

If you prefer using SQL:

1. Go to "SQL Editor" in the Supabase Dashboard
2. Run this query:

```sql
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS date_of_birth date;
```

## Verification

After adding the column, run this test script to verify the fix:

```bash
node scripts/test-after-manual-column-add.js
```

## Expected Result

Once the column is added:
- ✅ Frontend console errors should disappear
- ✅ Users table queries should work properly
- ✅ Age verification features will function correctly

## Migration Files

The following migration files contain this fix but couldn't be applied due to conflicts:
- `20250911075325_add_missing_date_of_birth_column.sql`
- `050_add_date_of_birth_column_simple.sql`

These files are safe to apply individually once database conflicts are resolved.