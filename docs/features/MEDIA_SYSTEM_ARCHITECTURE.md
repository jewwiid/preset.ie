# Media System Architecture Documentation

## Overview

This document outlines the complete media storage system architecture, including unified media management, storage locations, and data flow.

## Storage Locations

### 1. Supabase Storage Buckets

| Bucket | Purpose | File Types | Access |
|--------|---------|------------|---------|
| `playground-images` | Generated AI images from playground | PNG, JPG, WebP | Public (signed URLs) |
| `user-uploads` | Direct user uploaded content | All formats | Private (auth required) |
| `enhanced-images` | AI-enhanced versions of images | PNG, JPG, WebP | Public (signed URLs) |
| `profile-images` | User profile pictures | JPG, PNG | Public |
| `showcase-images` | Portfolio/showcase content | All formats | Public |

### 2. Database Tables

#### Primary Tables

**`media`** (Future unified table - planned)
```sql
- id: UUID (primary key)
- owner_user_id: UUID (foreign key to auth.users)
- type: VARCHAR ('image', 'video', 'document')
- bucket: VARCHAR (storage bucket name)
- path: VARCHAR (file path in bucket)
- url: VARCHAR (full URL - optional)
- source_type: ENUM('upload', 'playground', 'enhanced', 'stock')
- enhancement_type: VARCHAR (AI style applied)
- original_media_id: UUID (reference to source media)
- metadata: JSONB (additional metadata)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**`playground_gallery`** (Current active table)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- title: VARCHAR
- description: TEXT
- image_url: VARCHAR (full URL to image)
- image_bucket: VARCHAR ('playground-images')
- image_path: VARCHAR (path in bucket)
- tags: TEXT[] (array of tags)
- generation_metadata: JSONB (AI generation data)
- source_type: VARCHAR ('playground', 'enhanced') ← Added in migration
- enhancement_type: VARCHAR (style applied) ← Added in migration
- original_media_id: VARCHAR ← Added in migration
- migrated_to_media: BOOLEAN DEFAULT FALSE ← Added in migration
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**`user_media`** (Legacy table - being phased out)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- file_path: VARCHAR
- file_type: VARCHAR
- metadata: JSONB
- created_at: TIMESTAMP
```

## API Endpoints

### 1. Media Management API

**`GET /api/media`** - List user's media
- Query params: `source_type`, `page`, `limit`
- Response: Array of media items with metadata
- Authentication: Required (JWT token)

**`PUT /api/media/[id]`** - Update media metadata
- Body: `{ title, description, tags }`
- Response: Updated media item
- Authentication: Required (JWT token)

**`DELETE /api/media/[id]`** - Delete media item
- Response: Success confirmation
- Authentication: Required (JWT token)

### 2. Legacy Endpoints

**`GET /api/user-media`** - Legacy user media (being deprecated)
**`POST /api/upload`** - Direct file upload endpoint
**`GET /api/playground/gallery`** - Playground images (integrated into unified API)

## Data Flow

### 1. Image Upload Flow

```
User Upload → API Endpoint → Supabase Storage → Database Record → Media Dashboard
```

### 2. AI Generation Flow

```
AI Request → AI Service → Supabase Storage → playground_gallery Table → API → Dashboard
```

### 3. Enhancement Flow

```
Original Image → AI Enhancement → Enhanced Bucket → Enhanced Record → API → Dashboard
```

## Source Type Classification

### Automatic Detection Logic

```typescript
function determineSourceType(item: any): 'upload' | 'playground' | 'enhanced' | 'stock' {
  // Enhanced content detection
  if (metadata.enhancement_type ||
      metadata.style_applied ||
      metadata.source === 'ai_enhancement' ||
      item.title?.toLowerCase().includes('enhanced') ||
      item.tags?.includes('ai-enhanced')) {
    return 'enhanced';
  }

  // Playground content
  if (item.source === 'playground_gallery') {
    return 'playground';
  }

  // Stock/external content
  if (item.source === 'pexels' || item.source === 'unsplash') {
    return 'stock';
  }

  // Default to user upload
  return 'upload';
}
```

### Badge Display Rules

- **Enhanced**: Purple badge with sparkle icon
- **Playground**: Green badge with playground icon
- **Stock**: Blue badge with external icon
- **Upload**: Gray badge with upload icon

## Migration Scripts

### 1. Past Content Fix Script
**Location**: `scripts/simple-past-content-fix.ts`

**Purpose**: Add missing columns to existing playground_gallery entries
- Added `source_type`, `enhancement_type`, `original_media_id`, `migrated_to_media` columns
- Updated existing entries with proper source type detection
- Marked items as migration-ready for future unified table migration

### 2. RLS Policies Script
**Location**: `scripts/fix-rls-policies.sql`

**Purpose**: Implement proper Row Level Security
- Users can view/update their own media
- Admin bypass for system operations
- Public access for signed URLs only

## File Structure

```
apps/web/
├── app/
│   ├── api/
│   │   ├── media/
│   │   │   ├── route.ts              # Unified media API
│   │   │   └── [id]/
│   │   │       └── route.ts          # Individual media operations
│   │   ├── upload/
│   │   │   └── route.ts              # File upload endpoint
│   │   └── playground/
│   │       └── gallery/
│   │           └── route.ts          # Legacy playground API
│   └── dashboard/
│       └── media/
│           └── page.tsx              # Media management dashboard
├── components/
│   ├── ui/
│   │   ├── media-badge.tsx           # Source type badges
│   │   └── content-flagging.tsx      # Content moderation
│   └── dashboard/
│       └── MediaDashboard.tsx        # Main media interface
lib/
├── hooks/
│   ├── useMedia.ts                   # Media state management
│   └── usePlatformGeneratedImages.ts # AI image handling
└── utils/
    └── media-helpers.ts              # Media utility functions

scripts/
├── simple-past-content-fix.ts        # Past content migration
├── fix-rls-policies.sql              # Security policies
└── migrate-past-content.ts           # Legacy migration script
```

## Security Considerations

### 1. Authentication
- All media APIs require valid JWT token
- Session-based authentication for dashboard
- Admin client only for system operations

### 2. Authorization
- Row Level Security (RLS) on all tables
- Users can only access their own media
- Public access only through signed URLs

### 3. Storage Security
- Private buckets for sensitive content
- Public buckets with signed URL access
- Content scanning and moderation

## Performance Optimizations

### 1. Database Indexes
```sql
-- Created indexes for common queries
CREATE INDEX idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX idx_playground_gallery_source_type ON playground_gallery(source_type);
CREATE INDEX idx_playground_gallery_created_at ON playground_gallery(created_at DESC);
```

### 2. Image Optimization
- Automatic format conversion (WebP)
- Multiple size variants
- Lazy loading in dashboard
- CDN distribution through Supabase

## Future Plans

### 1. Unified Media Table Migration
- Migrate playground_gallery and user_media to unified `media` table
- Maintain backward compatibility during transition
- Update all APIs to use unified table

### 2. Enhanced Features
- Bulk operations (select multiple media)
- Advanced filtering and search
- Image editing capabilities
- Collection/folder organization

### 3. Performance Improvements
- Image caching strategies
- Background processing for large uploads
- Progressive image loading
- Offline media access

## Troubleshooting

### Common Issues

1. **"No media found" despite existing content**
   - Check RLS policies are applied
   - Verify authentication tokens
   - Run past content fix script

2. **PUT requests return 500 errors**
   - Check for multiple dev servers running
   - Verify API uses `.maybeSingle()` for UPDATE operations
   - Ensure proper admin client configuration

3. **Authentication failures**
   - Verify session tokens in API calls
   - Check dashboard includes Authorization headers
   - Confirm RLS policies allow user access

### Debug Commands

```bash
# Check for running dev servers
ps aux | grep -E "(next|npm.*dev)"

# Kill conflicting servers
lsof -ti:3000 | xargs kill -9

# Verify database schema
psql -h [host] -U [user] -d [database] -c "\d playground_gallery"

# Test API endpoints
curl -H "Authorization: Bearer [token]" http://localhost:3000/api/media
```

---

**Last Updated**: October 2025
**Version**: 1.0
**Maintainers**: Development Team