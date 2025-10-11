# Playground Storage - Complete Fix Summary ✅

## Problem Fixed
Reference images uploaded for generation were being stored permanently, causing storage accumulation.

## Solutions Implemented

### 1. ✅ RLS Policies Fixed
All storage buckets now have proper RLS policies:
- `playground-uploads` - Temporary reference images
- `playground-gallery` - Saved generation results
- `playground images/media` - Other playground assets

**Result**: Uploads work without RLS errors

---

### 2. 🧹 Cleanup Function Added

**Migration**: `20251010000002_add_playground_cleanup.sql`

**What it does:**
- Cleans up temporary reference images older than 7 days
- Only removes `base-images` (reference/input images)
- Does NOT touch saved generations
- Can be called manually or scheduled

**Manual cleanup:**
```sql
SELECT cleanup_old_playground_uploads();
```

**Returns**: Number of files deleted

---

## How It Works Now

### Image Upload Flow

#### For Video/Image Generation (Reference Images):
1. User uploads image → stored in `playground-uploads/{user_id}/base-images/`
2. Image URL sent to generation API
3. User generates video/image
4. **After 7 days**: Image auto-deleted (if not saved)

#### For Saved Generations:
1. User saves generated image → stored in `playground-gallery`
2. Image stays **permanently**
3. Never cleaned up (these are intentionally saved)

---

## Storage Buckets Overview

| Bucket | Purpose | Cleanup | Public |
|--------|---------|---------|--------|
| `playground-uploads` | Temp reference images | ✅ 7 days | No |
| `playground-gallery` | Saved generations | ❌ Never | Yes |
| `profile-images` | Avatars & banners | ❌ Manual | Yes |

---

## Next Steps

### Option 1: Enable Automatic Cleanup (Recommended)

**If you have Supabase Pro with pg_cron:**
```sql
-- Schedule cleanup to run daily at 3 AM
SELECT cron.schedule(
  'cleanup-playground-uploads',
  '0 3 * * *',  -- 3 AM daily
  $$SELECT cleanup_old_playground_uploads()$$
);
```

### Option 2: Manual Cleanup

Run this periodically in SQL Editor:
```sql
SELECT cleanup_old_playground_uploads();
```

### Option 3: External Cron Job

Create a scheduled task/cron job that calls:
```bash
curl -X POST https://your-project.supabase.co/rest/v1/rpc/cleanup_old_playground_uploads \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

## Monitoring

**Check storage usage:**
```sql
-- Count files in playground-uploads
SELECT 
  COUNT(*) as total_files,
  SUM(COALESCE((metadata->>'size')::bigint, 0)) / 1024 / 1024 as total_size_mb
FROM storage.objects
WHERE bucket_id = 'playground-uploads';

-- Count old files that would be cleaned up
SELECT 
  COUNT(*) as files_to_cleanup,
  SUM(COALESCE((metadata->>'size')::bigint, 0)) / 1024 / 1024 as size_to_free_mb
FROM storage.objects
WHERE bucket_id = 'playground-uploads'
  AND name LIKE '%/base-images/%'
  AND created_at < NOW() - INTERVAL '7 days';
```

---

## Configuration

**To change cleanup age** (currently 7 days):

Edit the function in SQL Editor:
```sql
CREATE OR REPLACE FUNCTION cleanup_old_playground_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'playground-uploads'
    AND name LIKE '%/base-images/%'
    AND created_at < NOW() - INTERVAL '14 days';  -- ← Change here
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Testing

**1. Test the cleanup function:**
```sql
-- See what would be deleted (dry run)
SELECT 
  name,
  created_at,
  NOW() - created_at as age
FROM storage.objects
WHERE bucket_id = 'playground-uploads'
  AND name LIKE '%/base-images/%'
  AND created_at < NOW() - INTERVAL '7 days'
LIMIT 10;

-- Run actual cleanup
SELECT cleanup_old_playground_uploads();
```

**2. Verify it worked:**
```sql
SELECT 
  COUNT(*) as remaining_old_files
FROM storage.objects
WHERE bucket_id = 'playground-uploads'
  AND name LIKE '%/base-images/%'
  AND created_at < NOW() - INTERVAL '7 days';
```

Should return 0 after cleanup.

---

## Summary

✅ **RLS policies fixed** - Uploads work properly  
✅ **Cleanup function created** - Prevents storage accumulation  
✅ **Saved generations protected** - Never cleaned up  
✅ **Temporary uploads cleaned** - After 7 days  

**Your storage should now be under control!** 🎉

