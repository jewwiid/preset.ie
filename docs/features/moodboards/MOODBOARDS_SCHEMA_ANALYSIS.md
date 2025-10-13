# Moodboards Table Schema Analysis

## Overview
The `moodboards` table is a comprehensive schema that supports all the functionality we've been testing, including AI analysis, template saving, public/private visibility, and advanced analytics.

## Core Features Supported

### 1. **Basic Moodboard Data**
- `id`: UUID primary key
- `gig_id`: Optional link to gigs (for gig-specific moodboards)
- `owner_user_id`: User who created the moodboard
- `title`: Moodboard title (up to 255 characters)
- `summary`: Detailed description
- `palette`: JSONB color palette extracted from images
- `items`: JSONB array of moodboard items (images, videos, etc.)

### 2. **Public/Private Visibility** ✅
- `is_public`: Boolean flag for public visibility
- **Index**: `idx_moodboards_is_public` for efficient public moodboard queries

### 3. **AI Analysis System** ✅
- `ai_analysis_status`: Status tracking ('pending', 'processing', 'completed', 'failed')
- `ai_analyzed_at`: Timestamp of AI analysis completion
- `vibe_summary`: AI-generated aesthetic summary
- `mood_descriptors`: AI-generated mood tags (ethereal, bold, etc.)
- `ai_provider`: Which AI provider was used

### 4. **Template System** ✅
- `is_template`: Boolean flag for template moodboards
- `template_name`: Name of the template
- `template_description`: Template description
- **Index**: `idx_moodboards_is_template` for efficient template queries

### 5. **Tag Management** ✅
- `tags`: Array of user-selected and AI-generated tags
- **Index**: `idx_moodboards_tags` using GIN for efficient tag searches

### 6. **Cost Tracking & Analytics**
- `total_cost`: Total credits spent on AI operations
- `source_breakdown`: JSONB breakdown of image sources
- `enhancement_log`: JSONB log of AI enhancement operations
- `generated_prompts`: Array of AI-generated prompts

### 7. **Advanced Search & Filtering**
- `vibe_ids`: Array of vibe IDs (max 5)
- **Full-text search**: `idx_moodboards_vibe_search` for vibe_summary
- **GIN indexes**: For efficient array-based searches

## Performance Optimizations

### Indexes Created:
1. **`idx_moodboards_vibe_ids`** - GIN index for vibe ID arrays
2. **`idx_moodboards_tags`** - GIN index for tag arrays
3. **`idx_moodboards_mood`** - GIN index for mood descriptors
4. **`idx_moodboards_vibe_search`** - Full-text search on vibe_summary
5. **`idx_moodboards_is_template`** - Partial index for templates only
6. **`idx_moodboards_gig_id`** - Partial index for gig-linked moodboards
7. **`idx_moodboards_is_public`** - Partial index for public moodboards
8. **`idx_moodboards_owner_user_id`** - B-tree index for user queries
9. **`idx_moodboards_created_at`** - Descending index for recent moodboards

### Triggers:
1. **`trigger_update_user_vibe_analytics`** - Updates user analytics when vibe_ids change
2. **`update_moodboards_updated_at`** - Auto-updates updated_at timestamp

## Data Integrity

### Constraints:
- **Primary Key**: `moodboards_pkey` on `id`
- **Foreign Keys**: 
  - `gig_id` → `gigs(id)` with CASCADE delete
  - `owner_user_id` → `users_profile(id)` with CASCADE delete
- **Check Constraints**:
  - `check_moodboard_vibe_limit`: Max 5 vibe IDs
  - `check_ai_analysis_status`: Valid status values

## Usage Examples

### Creating a Public Template Moodboard:
```sql
INSERT INTO moodboards (
  owner_user_id,
  title,
  summary,
  is_public,
  is_template,
  template_name,
  template_description,
  tags,
  items
) VALUES (
  'user-uuid',
  'Cinematic Portrait Template',
  'Professional portrait moodboard template',
  true,
  true,
  'Cinematic Portraits',
  'Perfect for dramatic portrait photography',
  ARRAY['cinematic', 'dramatic', 'portrait'],
  '[{"type": "image", "url": "..."}]'::jsonb
);
```

### Querying Public Templates:
```sql
SELECT * FROM moodboards 
WHERE is_template = true 
  AND is_public = true 
ORDER BY created_at DESC;
```

### AI Analysis Update:
```sql
UPDATE moodboards 
SET 
  ai_analysis_status = 'completed',
  ai_analyzed_at = now(),
  vibe_summary = 'Dramatic cinematic aesthetic with moody lighting',
  mood_descriptors = ARRAY['dramatic', 'cinematic', 'moody'],
  tags = ARRAY['cinematic', 'dramatic', 'portrait', 'moody']
WHERE id = 'moodboard-uuid';
```

## Migration Status
✅ **Migration Created**: `20250113000000_create_comprehensive_moodboards_table.sql`
✅ **All Features Supported**: Public/private, templates, AI analysis, tags
✅ **Performance Optimized**: Comprehensive indexing strategy
✅ **Data Integrity**: Proper constraints and foreign keys
✅ **Documentation**: Complete schema comments

This schema fully supports all the moodboard functionality we've been testing and provides a solid foundation for future enhancements.



