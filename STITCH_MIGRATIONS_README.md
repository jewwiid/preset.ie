# Stitch Feature Database Migrations

## Overview

This migration adds database support for user-created Stitch presets and custom image type libraries.

## What This Adds

### 1. User Custom Image Type Library
- Save frequently used custom type labels
- Auto-suggest saved types in dropdown
- Track usage statistics

### 2. Community Image Type Suggestions  
- Discover popular types from community
- Pre-seeded with 12 common types
- Approval system for quality control

### 3. User-Created Stitch Presets
- Create and save custom stitch presets
- Share presets publicly or keep private
- Template system with variable placeholders
- Cinematic parameter defaults

### 4. Preset Social Features
- Like/favorite presets
- Usage tracking and analytics
- Featured presets

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy contents of `supabase/migrations/20251013_stitch_enhancements.sql`
5. Paste and click **Run**
6. Wait for "Success" confirmation

### Option 2: Supabase CLI

```bash
cd /Users/judeokun/Documents/GitHub/preset/preset.ie/preset

# Make sure Supabase CLI is linked to your project
supabase db push

# Or run the specific migration
supabase db reset --db-url "your-db-connection-string"
```

### Option 3: Direct SQL Connection

```bash
# Connect to your Postgres database
psql "your-database-connection-string"

# Run the migration
\i supabase/migrations/20251013_stitch_enhancements.sql
```

## Database Schema

### Tables Created

1. **user_image_type_library** - User's custom image types
   - Columns: `id`, `user_id`, `type_label`, `description`, `usage_count`, `last_used_at`, `created_at`
   - Policies: Users can only see/modify their own types

2. **suggested_image_types** - Community type suggestions
   - Columns: `id`, `type_label`, `description`, `category`, `usage_count`, `is_approved`
   - Policies: Public can view approved types

3. **stitch_presets** - User-created presets
   - Columns: `id`, `name`, `description`, `category`, `prompt_template`, `required_image_types`, `optional_image_types`, `max_images_suggestion`, `aspect_ratio_suggestion`, `provider_preference`, `cinematic_parameters`, `examples`, `usage_count`, `likes_count`, `is_public`
   - Policies: Users can see own + public presets

4. **stitch_preset_likes** - Preset likes tracking
   - Columns: `preset_id`, `user_id`, `created_at`
   - Policies: Anyone can view, users can like/unlike

5. **stitch_preset_usage** - Usage analytics
   - Columns: `id`, `preset_id`, `user_id`, `num_images_generated`, `aspect_ratio_used`, `provider_used`, `success`
   - Policies: Users can view own usage

6. **stitch_preset_categories** - Category definitions
   - Pre-seeded with 4 categories

### Views Created

1. **popular_stitch_presets** - Top public presets by likes/usage
2. **my_stitch_presets** - User's own presets + liked presets

## Example Queries

### Get User's Custom Types

```sql
SELECT type_label, usage_count, last_used_at
FROM user_image_type_library
WHERE user_id = auth.uid()
ORDER BY usage_count DESC, last_used_at DESC
LIMIT 10;
```

### Get Popular Custom Types

```sql
SELECT type_label, description, category
FROM suggested_image_types
WHERE is_approved = true
ORDER BY usage_count DESC
LIMIT 20;
```

### Get Public Presets by Category

```sql
SELECT id, name, description, likes_count, usage_count
FROM stitch_presets
WHERE is_public = true AND category = 'character-scene'
ORDER BY likes_count DESC, usage_count DESC;
```

### Get User's Presets

```sql
SELECT *
FROM my_stitch_presets
ORDER BY is_mine DESC, created_at DESC;
```

### Check if User Liked a Preset

```sql
SELECT EXISTS(
  SELECT 1 FROM stitch_preset_likes
  WHERE preset_id = 'preset-uuid-here'
  AND user_id = auth.uid()
) as is_liked;
```

## API Endpoints to Create

After running this migration, you'll want to create these API routes:

### 1. Custom Types Management

```typescript
// apps/web/app/api/stitch/custom-types/route.ts

// GET - Fetch user's custom types + popular suggestions
// POST - Save new custom type
// PUT - Update type description
// DELETE - Remove custom type
```

### 2. Preset CRUD

```typescript
// apps/web/app/api/stitch/presets/route.ts

// GET - Fetch user's presets + public presets
// POST - Create new preset
// PUT - Update preset (user's own only)
// DELETE - Delete preset (user's own only)
```

### 3. Preset Actions

```typescript
// apps/web/app/api/stitch/presets/[id]/like/route.ts
// POST - Like a preset
// DELETE - Unlike a preset

// apps/web/app/api/stitch/presets/[id]/use/route.ts  
// POST - Track preset usage
```

## Testing the Migration

After running the migration, verify:

```sql
-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%stitch%';

-- 2. Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename LIKE '%stitch%';

-- 3. Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE '%stitch%';

-- 4. Check seed data
SELECT * FROM suggested_image_types;
SELECT * FROM stitch_preset_categories;

-- 5. Test insert as authenticated user
INSERT INTO user_image_type_library (user_id, type_label, description)
VALUES (auth.uid(), 'test-type', 'Test description');

SELECT * FROM user_image_type_library WHERE user_id = auth.uid();

DELETE FROM user_image_type_library WHERE type_label = 'test-type';
```

## Pre-seeded Data

### 12 Suggested Image Types

Category breakdown:
- **Artistic**: mood board, color palette, texture, atmosphere
- **Product**: brand logo, prop
- **People**: model, pose
- **Environment**: background
- **Technical**: lighting, composition, angle

### 4 Preset Categories

1. Character & Scene
2. Product Marketing
3. Style Transfer
4. Creative Composite

## Migration Safety

✅ **Safe to run:**
- Creates new tables only
- No modifications to existing tables
- RLS policies protect user data
- Triggers handle automatic updates
- Indexes optimize performance
- Can be run multiple times safely (uses IF NOT EXISTS)

⚠️ **Important:**
- Test on development/staging first
- Backup database before running on production
- Verify with validation script after migration
- Test API endpoints before deploying to users

## Next Steps After Migration

1. **Create API Routes** (see examples above)
2. **Update Frontend Components**:
   - Fetch user's custom types for dropdown
   - Load user's + public presets
   - Add "Create Preset" button
   - Add like/unlike functionality
3. **Test User Flow**:
   - User saves custom type
   - User creates preset
   - User shares preset publicly
   - User likes another user's preset

## Estimated Impact

- **Storage**: ~1-5 KB per preset, ~100 bytes per custom type
- **Performance**: Indexed queries, minimal impact
- **User Value**: High - enables preset creation and sharing


