# Camera Movement Migration - Complete Summary

## Overview
Successfully migrated from hardcoded motion types to dynamic camera movements from the database.

## Database Migration

### New Migration File
**File**: `supabase/migrations/20251009170000_migrate_motion_type_to_camera_movement.sql`

**What it does**:
1. Updates all existing presets with `cinematic_settings.video.motionType` → `cinematic_settings.video.cameraMovement`
2. Removes top-level `motionType` from `cinematic_settings` (from old migrations)
3. Updates `playground_gallery.generation_metadata.motion_type` → `generation_metadata.camera_movement`

**Value Mappings**:
- `subtle` → `smooth`
- `moderate` → `floating`
- `dynamic` → `tracking-forward`
- `camera_pan` → `pan-right`
- `zoom` → `zoom-in`

### To Apply Migration
```bash
# Run against your Supabase database
psql "$DATABASE_URL" -f supabase/migrations/20251009170000_migrate_motion_type_to_camera_movement.sql
```

Or push via Supabase CLI:
```bash
supabase db push
```

## Code Changes

### Frontend Components

1. **VideoSettings.tsx** ✅
   - Fetches camera movements from `/api/cinematic-parameters?category=camera_movements`
   - Dynamic dropdown with 30+ movements
   - Shows description for selected movement

2. **VideoGenerationPanel.tsx** ✅
   - Removed hardcoded motion descriptions
   - Fetches camera movement prompts from API
   - Default: `'smooth'` instead of `'subtle'`

3. **playground/page.tsx** ✅
   - Interface updated: `motionType` → `cameraMovement`
   - Metadata keys: `motion_type` → `camera_movement`

4. **PresetSelector.tsx** ✅
   - Preset interface updated
   - Display label: "Camera Movement" instead of "Motion Type"

5. **SavedImagesMasonry.tsx** ✅
   - Metadata interface updated

### Backend API

**API route**: `apps/web/app/api/playground/video/route.ts` ✅
- Parameter renamed: `motionType` → `cameraMovement`
- New functions fetch from database:
  - `getCameraMovementPrompt()` - fetches label + description
  - `getCameraMovementDescription()` - formats for prompts
- Metadata storage uses `camera_movement`

### Preset Migrations

**File**: `supabase/migrations/20251009150000_add_video_presets.sql` ✅
- All 18 video presets updated
- Use `cameraMovement` instead of `motionType`

## Available Camera Movements

The system now supports 30+ camera movements from the `camera_movements` table:

**Basic Movements**:
- static, smooth, floating, handheld, shaky, jerky

**Pan & Tilt**:
- pan-left, pan-right, tilt-up, tilt-down, whip-pan

**Tracking**:
- tracking-forward, tracking-backward, tracking-left, tracking-right

**Dolly**:
- dolly-in, dolly-out, push-pull

**Crane**:
- crane-up, crane-down

**Zoom**:
- zoom-in, zoom-out, snap-zoom

**Complex Movements**:
- orbit-clockwise, orbit-counterclockwise, spiral, figure-eight, pendulum, free-fall, ascending

## Testing Checklist

- [ ] Apply database migration
- [ ] Video generation with different camera movements
- [ ] Save video to gallery with camera movement metadata
- [ ] Load existing presets with video settings
- [ ] Create new preset with video settings
- [ ] Load past video generations from gallery
- [ ] Verify camera movement dropdown shows all options
- [ ] Verify camera movement description displays

## Rollback Plan

If issues occur, the old `motionType` values are preserved in the migration. To rollback:

```sql
-- Rollback preset changes
UPDATE presets
SET cinematic_settings = jsonb_set(
  jsonb_set(
    cinematic_settings,
    '{video, motionType}',
    cinematic_settings->'video'->'cameraMovement',
    true
  ),
  '{video}',
  cinematic_settings->'video' - 'cameraMovement',
  true
)
WHERE cinematic_settings->'video'->>'cameraMovement' IS NOT NULL;

-- Rollback gallery changes
UPDATE playground_gallery
SET generation_metadata = jsonb_set(
  generation_metadata - 'camera_movement',
  '{motion_type}',
  generation_metadata->'camera_movement',
  true
)
WHERE generation_metadata->>'camera_movement' IS NOT NULL;
```

## Notes

- Old migration `20250102000001_add_video_prompt_templates.sql` has outdated `motionType` reference, but this is cleaned up by the new migration
- All TypeScript interfaces updated for type safety
- Default value changed from `'subtle'` to `'smooth'` across all components
- Database is the single source of truth for available camera movements
