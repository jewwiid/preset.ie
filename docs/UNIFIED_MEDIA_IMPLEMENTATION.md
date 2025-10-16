# Unified Media Storage Implementation

## Overview

This document outlines the implementation of a unified media storage system that consolidates fragmented image storage across the platform into a single, manageable system.

## Problem Statement

The original system had fragmented media storage:
- **Playground images**: `playground-images` bucket + `playground_gallery` table
- **User uploads**: `user-media` bucket + `user_media` table
- **Enhanced images**: Two different storage methods (user-media vs playground-images)
- **Stock photos**: Downloaded but not integrated with media management
- **No unified view**: Users couldn't see all media in one place

## Solution Architecture

### Database Schema Changes

**Extended `media` table** with new fields:
```sql
ALTER TABLE media ADD COLUMN source_type VARCHAR(20) DEFAULT 'upload';
ALTER TABLE media ADD COLUMN enhancement_type VARCHAR(50);
ALTER TABLE media ADD COLUMN original_media_id VARCHAR(50);
ALTER TABLE media ADD COLUMN metadata JSONB DEFAULT '{}';
```

**Source Types:**
- `upload` - Direct user uploads
- `playground` - AI playground generations
- `enhanced` - AI-enhanced images from moodboard editor
- `stock` - Downloaded stock photos

### Bucket Structure (Simplified)

Maintained existing buckets but with organized paths:
```
user-media/
├── enhanced/{userId}/          # AI-enhanced images
├── uploads/{userId}/images/    # User uploads
└── uploads/{userId}/videos/    # User videos (future)

playground-images/
├── {userId}/generated/         # AI playground generations
└── {userId}/enhanced/          # Enhanced playground images
```

## Implementation Components

### 1. Database Migration (`docs/migrations/unified_media_storage.sql`)

- Extends media table with source tracking
- Creates performance indexes
- Sets up Row Level Security (RLS) policies
- Creates unified view for cross-table queries

### 2. Unified Storage Library (`lib/unified-media-storage.ts`)

**Key Functions:**
- `saveEnhancedImageUnified()` - Single function for enhanced image storage
- `uploadUserImage()` - Unified user upload handling
- `uploadUserVideo()` - Foundation for video support
- `deleteMediaUnified()` - Unified media deletion
- `getUserUnifiedMedia()` - Unified media retrieval

**Benefits:**
- Single source of truth for all media operations
- Consistent metadata handling
- Proper source type tracking
- Foundation for video support

### 3. Migration Script (`scripts/migrate-unified-media.ts`)

**Migrates existing data:**
- `playground_gallery` → `media` table with `source_type: 'playground'`
- `user_media` → `media` table with appropriate source types
- Updates moodboard references to use unified media IDs
- Preserves all existing metadata and relationships

### 4. Updated Media Management Dashboard (`app/dashboard/media/page.tsx`)

**New Features:**
- Source type filtering (All Sources, Uploads, Playground, Enhanced, Stock)
- Unified media display with source badges
- Backward compatibility with existing data
- Enhanced metadata display
- Support for both old and new data structures

### 5. Updated Moodboard Enhancement (`components/moodboard/MoodboardBuilder.tsx`)

**Changes:**
- Uses `saveEnhancedImageUnified()` instead of dual storage methods
- Saves enhanced images with proper source tracking
- Updates moodboard items with unified media IDs
- Consistent metadata structure

### 6. FeaturedImageService Integration (`packages/adapters/src/services/featured-image.service.ts`)

**New Integration:**
- Featured images saved to unified media table
- Proper source type classification (stock, enhanced, etc.)
- Cross-referenced with moodboard data
- Attribution and metadata preservation

## Data Flow

### Enhanced Image Workflow (Moodboard Editor)

1. User enhances image in moodboard editor
2. Image is processed by AI (Nano Banana, C Dream, etc.)
3. `saveEnhancedImageUnified()` downloads and saves to `user-media` bucket
4. Creates entry in `media` table with `source_type: 'enhanced'`
5. Updates moodboard item with `mediaId` and permanent URL
6. Image appears in media management dashboard under "Enhanced" filter

### Featured Image Workflow (Stock Photos)

1. User selects stock photo as featured image
2. `FeaturedImageService.ensureFeaturedImageDownloaded()` called
3. Image downloaded and saved via unified storage
4. Creates entry in `media` table with `source_type: 'stock'`
5. Moodboard updated with permanent URL and media ID
6. Image appears in media management dashboard under "Stock" filter

### User Upload Workflow

1. User uploads image directly
2. `uploadUserImage()` handles storage
3. Creates entry in `media` table with `source_type: 'upload'`
4. Image appears in media management dashboard under "Uploads" filter

## API Changes

### Media API (`app/api/media/route.ts`)

**Updated to:**
- Query unified `media` table
- Maintain backward compatibility with legacy data
- Return unified format with both new and legacy fields
- Support source type filtering
- Handle both `playground_gallery` and `media` table data during migration

### Media Item API (`app/api/media/[id]/route.ts`)

**Updated to:**
- Handle updates for unified media structure
- Work with metadata field for titles/descriptions/tags
- Support both `playground_gallery` and `media` tables
- Unified deletion across both storage and database

## Benefits Achieved

### 1. **Single Source of Truth**
- All media accessible through unified `media` table
- Consistent metadata structure across all media types
- Single API endpoint for all media operations

### 2. **Enhanced User Experience**
- Media management dashboard shows all media in one place
- Source type filtering for better organization
- Consistent editing and management across all media types

### 3. **Developer Experience**
- Single library (`unified-media-storage.ts`) for all media operations
- Consistent patterns for media handling
- Better error handling and logging

### 4. **Future Foundation**
- Video support infrastructure in place
- Scalable to new media types
- Proper source tracking for analytics

### 5. **Data Integrity**
- No more fragmented storage systems
- Proper relationships between media and features
- Consistent metadata and attribution

## Migration Process

### Phase 1: Database Schema Updates
```bash
# Apply database migration
supabase db push docs/migrations/unified_media_storage.sql
```

### Phase 2: Data Migration
```bash
# Run migration script
npx tsx scripts/migrate-unified-media.ts
```

### Phase 3: Code Deployment
- Deploy updated code with unified storage functions
- Update API endpoints
- Deploy updated media management dashboard

### Phase 4: Verification
- Test all media upload workflows
- Verify enhanced image saving
- Check media management dashboard functionality
- Validate featured image integration

## Backward Compatibility

The implementation maintains full backward compatibility:

- **Legacy API support**: Media API returns both old and new field formats
- **Legacy URLs**: Existing image URLs continue to work
- **Legacy data**: Old `playground_gallery` and `user_media` entries still accessible
- **Gradual migration**: System works with mixed old/new data during transition

## Future Enhancements

### Immediate Next Steps
1. **Complete data migration** for all existing users
2. **Video upload support** in media management dashboard
3. **Bulk operations** for media organization
4. **Advanced search** across all media types

### Long-term Roadmap
1. **Media analytics** and usage insights
2. **Advanced filtering** by date, size, format
3. **Media collections** and albums
4. **AI-powered tagging** and categorization
5. **Cross-platform sharing** capabilities

## Troubleshooting

### Common Issues

1. **Enhanced images not appearing in dashboard**
   - Check if migration script has been run
   - Verify `source_type` is set to 'enhanced'
   - Check media API response format

2. **Featured images not saving permanently**
   - Verify FeaturedImageService integration
   - Check unified storage function calls
   - Review moodboard update logic

3. **Mixed old/new data causing display issues**
   - Ensure backward compatibility in API responses
   - Check data transformation in media API
   - Verify frontend handles both formats

### Debug Tools

- **Media API**: `/api/media` returns unified format with source info
- **Migration script**: Provides detailed logging of migration process
- **Database view**: `unified_media_view` shows all media in one place
- **Storage logs**: Supabase storage logs for upload/download verification

## Performance Considerations

### Database Indexes
- Added indexes on `source_type`, `owner_user_id`, and `enhancement_type`
- Optimized queries for media listing and filtering

### Storage Optimization
- Reused existing buckets to avoid data migration
- Organized paths for better cache performance
- Maintained existing CDN configurations

### API Performance
- Single query instead of multiple table joins
- Efficient filtering at database level
- Proper pagination for large media collections

## Security

### Row Level Security
- Users can only access their own media
- Public media visibility controlled by `visibility` field
- Admin access through service role keys

### File Security
- Signed URLs for private media
- Proper bucket permissions
- Validation of file types and sizes

## Conclusion

The unified media storage implementation successfully consolidates fragmented media systems into a single, manageable platform. It provides a solid foundation for future media features while maintaining full backward compatibility and improving the overall user experience.

The system is now ready for production deployment with proper migration paths and monitoring in place.