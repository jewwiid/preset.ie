# Usage Tracking Fix

## Problem
The `usage_count` field displayed on the presets page was **inaccurate**. While individual usage events were being tracked in the `preset_usage` table, the aggregated count shown in the UI (`presets.usage_count`) was not being properly updated.

## Root Cause
1. ❌ The `increment_preset_usage()` function existed but was **never called** in the codebase
2. ❌ Usage count was only updated during preset generation, not when usage was tracked via the API
3. ❌ A daily unique constraint prevented tracking multiple uses per day per user
4. ❌ The displayed `usage_count` field was out of sync with actual `preset_usage` records

## Solution Applied

### Migration: `20250930000001_fix_usage_tracking.sql`

This migration implements the following fixes:

#### 1. **Synced Historical Data**
```sql
UPDATE presets p
SET usage_count = (
    SELECT COUNT(*)
    FROM preset_usage pu
    WHERE pu.preset_id = p.id
)
```
- Retroactively synced all existing usage counts with actual usage records

#### 2. **Auto-Increment Trigger**
```sql
CREATE TRIGGER trigger_auto_increment_preset_usage_count
    AFTER INSERT ON preset_usage
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_preset_usage_count();
```
- Automatically increments `usage_count` whenever a new `preset_usage` record is inserted
- Updates `last_used_at` timestamp
- No manual intervention required

#### 3. **Removed Daily Constraint**
```sql
DROP INDEX IF EXISTS idx_preset_usage_daily_unique;
```
- Removed constraint that prevented multiple uses per day
- Users can now use the same preset multiple times per day
- All uses are accurately tracked

#### 4. **Updated Tracking Function**
- Modified `track_preset_usage()` to work seamlessly with the trigger
- Function now just inserts into `preset_usage` and lets the trigger handle the count

## How It Works Now

### When a Preset is Used:
1. User generates an image in playground using a preset
2. API calls `track_preset_usage()` function ([apps/web/app/api/playground/generate/route.ts:1507-1533](apps/web/app/api/playground/generate/route.ts#L1507-L1533))
3. Function inserts record into `preset_usage` table
4. **Trigger automatically fires** and increments `presets.usage_count`
5. UI displays accurate count from `presets.usage_count`

### Data Flow:
```
User Action → track_preset_usage() → INSERT preset_usage
                                    ↓
                              Trigger fires
                                    ↓
                           UPDATE presets.usage_count++
                                    ↓
                              UI shows accurate count
```

## Files Changed

### Created:
- `supabase/migrations/20250930000001_fix_usage_tracking.sql` - Main migration
- `scripts/fix-usage-tracking.sh` - Helper script to apply migration
- `scripts/verify-usage-tracking.sql` - Verification queries
- `USAGE_TRACKING_FIX.md` - This documentation

### No Code Changes Required
The existing tracking code in [apps/web/app/api/playground/generate/route.ts](apps/web/app/api/playground/generate/route.ts) already calls `track_preset_usage()`, so no application code changes are needed.

## Verification

### Run Verification Script
```bash
# Using Supabase CLI
npx supabase db execute < scripts/verify-usage-tracking.sql

# Or using psql directly
psql $DATABASE_URL -f scripts/verify-usage-tracking.sql
```

### Expected Results:
- ✅ Trigger `trigger_auto_increment_preset_usage_count` exists and is enabled
- ✅ All presets have accurate `usage_count` matching `preset_usage` records
- ✅ Daily unique constraint index no longer exists
- ✅ Function `auto_increment_preset_usage_count()` exists

### Manual Check via Supabase Dashboard:
```sql
-- Check a specific preset's usage
SELECT
    p.name,
    p.usage_count as displayed_count,
    COUNT(pu.id) as actual_records
FROM presets p
LEFT JOIN preset_usage pu ON p.id = pu.preset_id
WHERE p.id = 'YOUR_PRESET_ID'
GROUP BY p.id, p.name, p.usage_count;
```

## Testing

### Test the Trigger:
1. Go to playground and generate an image using any preset
2. Check the presets page - usage count should increment immediately
3. Generate another image with the same preset on the same day
4. Usage count should increment again (no daily limit)

### Test API Call:
```bash
curl -X POST 'http://localhost:3000/api/presets/[preset-id]/usage' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "usageType": "playground_generation",
    "usageData": {"test": true}
  }'
```

## Impact

### Before:
- ❌ Presets showing `0` or incorrect usage counts
- ❌ Only one use tracked per day per user
- ❌ Manual intervention required to fix counts
- ❌ Inaccurate trending/popular presets

### After:
- ✅ Accurate real-time usage counts
- ✅ All uses tracked (no daily limit)
- ✅ Automatic synchronization via trigger
- ✅ Accurate trending/popular preset rankings

## Future Improvements

Consider these enhancements:
1. **Analytics Dashboard**: Show usage trends over time
2. **Usage Heatmap**: Visualize when presets are most used
3. **Top Users**: Show power users of specific presets
4. **Notification Throttling**: Avoid notification spam for popular presets

## Rollback (if needed)

If you need to rollback this migration:
```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_auto_increment_preset_usage_count ON preset_usage;
DROP FUNCTION IF EXISTS auto_increment_preset_usage_count();

-- Restore daily unique constraint (optional)
CREATE UNIQUE INDEX idx_preset_usage_daily_unique
ON preset_usage(preset_id, user_id, usage_type, DATE(created_at));
```

## Support

If you encounter issues:
1. Check trigger status: `SELECT * FROM pg_trigger WHERE tgname LIKE '%usage%';`
2. Verify function exists: `SELECT * FROM pg_proc WHERE proname LIKE '%usage%';`
3. Check recent usage records: `SELECT * FROM preset_usage ORDER BY created_at DESC LIMIT 10;`
4. Run verification script: `psql $DATABASE_URL -f scripts/verify-usage-tracking.sql`
