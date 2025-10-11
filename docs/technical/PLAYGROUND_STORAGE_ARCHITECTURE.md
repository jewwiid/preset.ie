# Playground Storage Architecture (Corrected)

## Overview

The playground uses a **hybrid storage approach**:
- **Temporary generations**: External CDN URLs (expire in ~7 days)
- **Permanent saves**: Downloaded and stored in our Supabase buckets

## Database Tables

### playground_video_generations
**Purpose**: Track temporary video generations (not yet saved by user)
- Stores external CDN URLs from WaveSpeed/Seedream
- URLs expire after ~7 days (CDN side)
- When user saves → download video → upload to our storage → insert into `playground_gallery`

### playground_gallery
**Purpose**: Permanently saved images and videos
- Both images AND videos in one table
- `media_type` field: 'image' or 'video'
- References files in our permanent storage buckets
- Never expires

## Storage Buckets

### playground-uploads
```
playground-uploads/
  {user-id}/
    base-images/          # User-uploaded source images for generation
                          # ✅ PERMANENT - NEVER auto-delete
                          # Purpose: Show what the generation was based on
```

**Why permanent?**
- Users need to see the original source image
- Saved videos/images reference these in metadata
- Deleting would break "show source" functionality

### playground-videos
```
playground-videos/
  {user-id}/
    saved/                # Saved videos from playground_gallery table
                          # ✅ PERMANENT - NEVER auto-delete
```

**Current issue**: Videos saved to `{user-id}/video-*.mp4` instead of `{user-id}/saved/`

### playground-images
```
playground-images/
  {user-id}/
    saved/                # Saved generated images from playground_gallery
                          # ✅ PERMANENT - NEVER auto-delete
```

### playground-gallery (bucket)
**Status**: ❌ **SHOULD BE REMOVED**
- Not needed - we have `playground_gallery` database table
- Causes confusion with similarly named table
- Actual files should be in `playground-images` and `playground-videos`

## Complete Flow

### 1. Image Generation

```
┌─────────────────────────────────────────────────────────┐
│ User generates image                                    │
│   ↓                                                      │
│ Seedream API returns CloudFront URL                     │
│   ↓                                                      │
│ Store URL in: playground_video_generations (temp)       │
│ Storage: EXTERNAL CDN (expires ~7 days)                 │
│   ↓                                                      │
│ User clicks "Save"                                       │
│   ↓                                                      │
│ Download from CDN → Upload to:                          │
│   playground-images/{user-id}/saved/image-*.jpg         │
│   ↓                                                      │
│ Insert into playground_gallery table                    │
│   media_type: 'image'                                   │
│   image_url: permanent Supabase URL                     │
└─────────────────────────────────────────────────────────┘
```

### 2. Video Generation

```
┌─────────────────────────────────────────────────────────┐
│ User uploads base image                                 │
│   ↓                                                      │
│ Upload to: playground-uploads/{user-id}/base-images/    │
│   ↓                                                      │
│ User generates video                                    │
│   ↓                                                      │
│ WaveSpeed/Seedream returns CloudFront URL               │
│   ↓                                                      │
│ Store in: playground_video_generations                  │
│   video_url: external CDN URL                           │
│   generation_metadata: {                                │
│     image_url: base image URL (in playground-uploads)   │
│     styled_image_url: styled version (if applied)       │
│   }                                                      │
│ Storage: EXTERNAL CDN (expires ~7 days)                 │
│   ↓                                                      │
│ User clicks "Save"                                       │
│   ↓                                                      │
│ Download video from CDN → Upload to:                    │
│   playground-videos/{user-id}/saved/video-*.mp4         │
│   ↓                                                      │
│ Insert into playground_gallery table                    │
│   media_type: 'video'                                   │
│   video_url: permanent Supabase URL                     │
│   generation_metadata: {                                │
│     image_url: base image URL (still in uploads)        │
│     styled_image_url: styled version                    │
│   }                                                      │
│   ↓                                                      │
│ Base image stays in playground-uploads/base-images/     │
│ (never deleted - shows source for saved video)          │
└─────────────────────────────────────────────────────────┘
```

## Cleanup Strategy

### ✅ What Should Be Cleaned Up

**External CDN URLs** (automatic by CDN)
- Videos/images in `playground_video_generations` table
- URLs expire after ~7 days on CDN side
- Could optionally clean up old database rows

**Nothing in our buckets should be auto-deleted**

### ❌ What Should NEVER Be Cleaned Up

**playground-uploads/{user-id}/base-images/**
- Source images for generations
- Referenced in saved videos/images metadata
- Needed to show "what was this generated from?"

**playground-videos/{user-id}/saved/**
- Saved videos from `playground_gallery` table
- User explicitly saved these

**playground-images/{user-id}/saved/**
- Saved images from `playground_gallery` table
- User explicitly saved these

## Current Issues to Fix

### 1. ❌ Incorrect Cleanup Function
**File**: `supabase/migrations/105_update_playground_cleanup_exclude_saved.sql`

**Problem**: Tries to delete base-images after 7 days with exclusion logic

**Fix**: Remove this cleanup entirely - base-images are permanent

### 2. ❌ Wrong Bucket Usage
**Files**:
- `apps/web/app/api/playground/upload-image/route.ts`
- `apps/web/app/api/playground/save-to-gallery/route.ts`
- `apps/web/app/api/playground/save-video-to-gallery/route.ts`

**Problem**: Using `playground-gallery` bucket

**Fix**:
- Upload base images → `playground-uploads/{user-id}/base-images/`
- Save images → `playground-images/{user-id}/saved/`
- Save videos → `playground-videos/{user-id}/saved/`

### 3. ❌ Missing /saved/ Folder Structure
**File**: `apps/web/app/api/playground/save-video-to-gallery/route.ts`

**Problem**: Uploads to `playground-videos/{user-id}/video-*.mp4`

**Fix**: Upload to `playground-videos/{user-id}/saved/video-*.mp4`

### 4. ❌ playground-gallery Bucket Exists
**Status**: Should be removed/deprecated

**Fix**: Remove bucket, use `playground_gallery` table only

## Summary

| Bucket | Path | Purpose | Lifetime | Cleanup |
|--------|------|---------|----------|---------|
| playground-uploads | `{user-id}/base-images/` | User-uploaded source images | Permanent | Never |
| playground-images | `{user-id}/saved/` | Saved generated images | Permanent | Never |
| playground-videos | `{user-id}/saved/` | Saved generated videos | Permanent | Never |
| ~~playground-gallery~~ | - | ❌ Remove (use table instead) | - | - |

| Storage Location | Content | Lifetime |
|------------------|---------|----------|
| External CDN (Seedream/WaveSpeed) | Temporary generations | ~7 days |
| Our Supabase buckets | Saved generations + base images | Permanent |

| Database Table | Purpose | Cleanup |
|----------------|---------|---------|
| playground_video_generations | Temporary generation metadata | Optional (30 days) |
| playground_gallery | Permanent saved items | Never |
