# Playground Storage Architecture

## Overview

The playground storage system uses a single `playground-gallery` bucket with a folder-based structure to organize temporary and permanent content.

## Bucket Structure

```
playground-gallery/
├── {user-id}/
│   ├── temporary/
│   │   ├── images/          # User-uploaded base images (7-day cleanup)
│   │   └── videos/          # Generated videos not yet saved (7-day cleanup)
│   └── saved/
│       ├── images/          # Permanently saved images
│       └── videos/          # Permanently saved videos
```

## Lifecycle Flow

### 1. Image Upload (Video Generation)

```
User uploads image
    ↓
API: /api/playground/upload-image
    ↓
Storage: playground-gallery/{user-id}/temporary/images/upload-{timestamp}-{random}.{ext}
    ↓
Returns public URL for video generation
```

### 2. Video Generation

```
User generates video with uploaded image
    ↓
Video API stores reference to temporary image URL
    ↓
Video stored in playground-videos bucket (existing behavior)
    ↓
Video URL + metadata (including temp image URL) returned to client
```

### 3. Save to Gallery

```
User saves video to gallery
    ↓
API: /api/playground/save-video-to-gallery
    ↓
Move base images from temporary to saved:
  - playground-gallery/{user-id}/temporary/images/*
    → playground-gallery/{user-id}/saved/images/*
    ↓
Update generation_metadata with new permanent URLs
    ↓
Store in playground_gallery table with permanent URLs
```

For image saves:
```
User saves image to gallery
    ↓
API: /api/playground/save-to-gallery
    ↓
Move image from temporary to saved (if applicable)
    ↓
Store in playground_gallery table with permanent URL
```

## Automatic Cleanup

### Function: `cleanup_playground_temporary_content()`

**Purpose**: Delete temporary content older than 7 days

**Logic**:
```sql
DELETE FROM storage.objects
WHERE bucket_id = 'playground-gallery'
  AND name LIKE '%/temporary/%'
  AND created_at < NOW() - INTERVAL '7 days';
```

**Safe because**:
- Only deletes from `/temporary/` folders
- Saved content is moved to `/saved/` folders before being stored in database
- `/saved/` content is never touched by cleanup

### Legacy Function: `cleanup_old_playground_uploads()`

**Purpose**: Backward compatibility for old `playground-uploads` bucket

**Status**: Can be removed once all content migrated to new structure

## Benefits

### 1. **Clear Separation**
- Temporary vs permanent content separated by folder structure
- Easy to identify lifecycle stage of any file

### 2. **No Complex Exclusion Logic**
- Cleanup function simply deletes everything in `/temporary/` older than 7 days
- No need to cross-reference database tables

### 3. **Atomic Saves**
- When user saves content, it's moved from temporary to permanent
- Database only references permanent URLs
- No risk of cleanup deleting referenced content

### 4. **Efficient Storage**
- Unsaved experiments automatically cleaned up
- Saved content preserved indefinitely
- Users only "pay" for what they keep

### 5. **Single Bucket Management**
- All playground content in one bucket
- Easier to manage policies and permissions
- Consistent URL structure

## Migration Path

### Phase 1: Current State
- Images uploaded to `playground-gallery/{user-id}/temporary/images/`
- Videos stored in `playground-videos/{user-id}/`
- New cleanup function handles temporary content

### Phase 2: Video Migration (Optional)
Could move videos to playground-gallery as well:
- `playground-gallery/{user-id}/temporary/videos/` for unsaved videos
- `playground-gallery/{user-id}/saved/videos/` for saved videos
- Single bucket for all playground content

### Phase 3: Legacy Cleanup
- Remove `cleanup_old_playground_uploads()` function
- Archive or migrate old `playground-uploads` bucket content

## Implementation Files

### Storage Helpers
- **File**: `apps/web/app/api/playground/lib/storage-helpers.ts`
- **Functions**:
  - `moveImageToPermanentStorage()` - Moves image from temporary to saved
  - `moveVideoToPermanentStorage()` - Moves video from temporary to saved

### API Endpoints
- **Upload**: `apps/web/app/api/playground/upload-image/route.ts`
  - Uploads to `playground-gallery/{user-id}/temporary/images/`

- **Save Image**: `apps/web/app/api/playground/save-to-gallery/route.ts`
  - Moves image to permanent storage before saving metadata

- **Save Video**: `apps/web/app/api/playground/save-video-to-gallery/route.ts`
  - Moves video and associated images to permanent storage

### Database Migration
- **File**: `supabase/migrations/106_refactor_playground_storage_structure.sql`
- **Changes**:
  - Updates `playground-gallery` bucket to allow videos (100MB limit)
  - Creates `cleanup_playground_temporary_content()` function
  - Updates `cleanup_old_playground_uploads()` for backward compatibility

## Bucket Configuration

```sql
-- Bucket: playground-gallery
file_size_limit: 104857600 (100MB)
allowed_mime_types: [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]
public: true
```

## RLS Policies

All policies enforce user isolation via folder structure:

```sql
-- Users can only access their own folders
WHERE auth.uid()::text = (storage.foldername(name))[1]
```

This ensures:
- Users can only upload to their own folders
- Users can only view their own files
- Users can only delete their own files
- Admin operations use service role key to bypass RLS

## Troubleshooting

### Issue: Images deleted even though video is saved
**Cause**: Image wasn't moved from temporary to permanent during save
**Fix**: Check that `moveImageToPermanentStorage()` is being called in save routes

### Issue: Cleanup not running
**Cause**: Cleanup function needs to be scheduled (cron job or pg_cron)
**Fix**: Set up scheduled task to call cleanup functions daily

### Issue: Upload fails with RLS error
**Cause**: Client trying to upload directly without using service role API
**Fix**: Ensure all uploads go through `/api/playground/upload-image` endpoint
