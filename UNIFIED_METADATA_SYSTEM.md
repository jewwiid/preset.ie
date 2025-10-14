# Unified Media Metadata System

## Overview

The Unified Media Metadata System enhances the existing `generation_metadata` structure to provide comprehensive, transparent metadata for all media types across the platform. It maintains full backward compatibility while adding powerful new features for source image tracking and cross-referencing.

## 🔄 **Backward Compatibility**

### Existing Metadata Structure
The system preserves and enhances the existing `generation_metadata` JSONB field structure:

```json
{
  "prompt": "Create a beautiful landscape...",
  "enhanced_prompt": "Create a stunning, photorealistic landscape...",
  "style_prompt": "cinematic, dramatic lighting",
  "provider": "nanobanana",
  "resolution": "1024*1024",
  "aspect_ratio": "1:1",
  "cinematic_parameters": {
    "lightingStyle": "golden-hour",
    "compositionTechnique": "rule-of-thirds"
  },
  "generation_mode": "text-to-image",
  "credits_used": 0.027,
  "preset_id": "uuid",
  "preset_name": "Cinematic Landscape",
  "custom_style_preset": {...},
  "consistency_level": "high",
  "original_url": "https://...",
  "permanently_stored": true,
  "storage_method": "downloaded",
  "saved_at": "2025-01-13T..."
}
```

### Enhanced Fields for Stitch
For Stitch generations, additional fields are added:

```json
{
  // ... existing fields ...
  "generation_mode": "stitch",
  "source_images": [
    {
      "url": "https://...",
      "type": "character",
      "customLabel": "person",
      "source_image_id": "uuid"
    }
  ],
  "source_image_ids": ["uuid1", "uuid2"],
  "images_count": 3,
  "source_types": ["character", "location", "object"],
  "custom_labels": ["person", "beach", "handbag"]
}
```

## 🗄️ **Database Schema**

### New Tables

#### 1. `source_images`
Permanently stores source images used in generations:
```sql
CREATE TABLE source_images (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  storage_bucket TEXT DEFAULT 'source-images',
  storage_path TEXT NOT NULL,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  source_type TEXT CHECK (source_type IN ('upload', 'url', 'pexels', 'user_gallery', 'external')),
  image_type TEXT, -- 'character', 'location', 'style', etc.
  custom_label TEXT,
  source_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `generation_source_references`
Links generations to their source images:
```sql
CREATE TABLE generation_source_references (
  id UUID PRIMARY KEY,
  generation_id UUID NOT NULL,
  generation_type TEXT CHECK (generation_type IN ('project', 'gallery', 'showcase')),
  source_image_id UUID REFERENCES source_images(id),
  sequence_order INTEGER DEFAULT 0,
  image_role TEXT, -- The labeled type at time of use
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `media_cross_references`
Tracks where media is used across the platform:
```sql
CREATE TABLE media_cross_references (
  id UUID PRIMARY KEY,
  source_media_id UUID NOT NULL,
  source_media_type TEXT CHECK (source_media_type IN ('gallery', 'project', 'showcase', 'preset')),
  referenced_in_id UUID NOT NULL,
  referenced_in_type TEXT CHECK (referenced_in_type IN ('gallery', 'project', 'showcase', 'preset', 'stitch')),
  reference_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enhanced Existing Tables

#### `playground_projects`
```sql
ALTER TABLE playground_projects 
ADD COLUMN generation_type TEXT DEFAULT 'text-to-image',
ADD COLUMN cinematic_parameters JSONB DEFAULT NULL,
ADD COLUMN provider TEXT DEFAULT 'nanobanana';
```

#### `playground_gallery`
```sql
ALTER TABLE playground_gallery 
ADD COLUMN generation_type TEXT DEFAULT 'text-to-image';
-- generation_metadata column already exists
```

## 🔧 **API Integration**

### Stitch API Enhancement
The Stitch API now automatically:

1. **Downloads and stores source images** in Supabase Storage
2. **Creates source_images records** with metadata
3. **Links generations to source images** via generation_source_references
4. **Stores comprehensive metadata** in the existing generation_metadata format

```typescript
// Before generation, source images are stored
const storedSourceImages = await Promise.all(
  imagesPayload.map(async (img, index) => {
    // Download and store in Supabase Storage
    // Create source_images record
    // Return with source_image_id
  })
);

// After generation, metadata is stored
const projectData = {
  // ... existing fields ...
  generation_metadata: {
    prompt,
    enhanced_prompt,
    provider,
    resolution,
    aspect_ratio,
    cinematic_parameters,
    generation_mode: 'stitch',
    credits_used,
    source_images: storedSourceImages,
    source_image_ids: storedSourceImages.map(s => s.source_image_id),
    // ... other fields
  }
};
```

### Unified Metadata API
The `/api/metadata/unified` endpoint provides:

- **Comprehensive metadata** from all sources (gallery, project, showcase)
- **Source image information** for Stitch generations
- **Cross-reference tracking** showing where media is used
- **Backward compatibility** with existing metadata structure

## 🎨 **UI Components**

### UnifiedMediaMetadataModal
A comprehensive modal that displays:

- **Media preview** (image/video)
- **Complete generation metadata** in tabbed interface
- **Source images** (for Stitch) with thumbnails and labels
- **Technical details** (resolution, provider, credits)
- **Cinematic parameters** with visual indicators
- **Cross-references** showing usage across platform

### Integration with Existing Components
- **SavedImagesMasonry** now uses UnifiedMediaMetadataModal
- **Maintains all existing functionality** (AI analysis, editing, etc.)
- **Adds comprehensive metadata display** without breaking changes

## 🔍 **Source Image Tracking**

### For Stitch Generations
1. **Upload**: Source images are automatically downloaded and stored
2. **Storage**: Images stored in `source-images` Supabase bucket
3. **Database**: Records created in `source_images` table
4. **Linking**: `generation_source_references` links generations to sources
5. **Display**: Unified modal shows source images with thumbnails

### For All Media Types
1. **Cross-referencing**: Tracks where media is used
2. **Audit trail**: Complete history of media usage
3. **Transparency**: Full visibility into generation process

## 🚀 **Benefits**

### For Users
- **Complete transparency** in generation process
- **Source image visibility** for Stitch generations
- **Easy sharing** of generation details
- **Comprehensive metadata** in one place

### For Developers
- **Backward compatibility** with existing system
- **Unified interface** for all metadata
- **Extensible structure** for future enhancements
- **Performance optimized** with proper indexing

### For Platform
- **Audit trail** for all generations
- **Source tracking** for compliance
- **Cross-referencing** for analytics
- **Scalable architecture** for growth

## 🔄 **Migration Strategy**

### Phase 1: Database Schema ✅
- Create new tables for source tracking
- Add enhanced columns to existing tables
- Ensure backward compatibility

### Phase 2: API Enhancement ✅
- Update Stitch API to store source images
- Create unified metadata API
- Maintain existing API compatibility

### Phase 3: UI Integration ✅
- Create UnifiedMediaMetadataModal
- Update existing components
- Maintain existing functionality

### Phase 4: Future Enhancements
- Add more cross-referencing features
- Enhance source image management
- Add analytics and insights

## 📊 **Data Flow**

```
User Uploads Images → Stitch API
    ↓
Download & Store in Supabase Storage
    ↓
Create source_images records
    ↓
Generate Images via External API
    ↓
Store in playground_projects with enhanced metadata
    ↓
Create generation_source_references
    ↓
Display in UnifiedMediaMetadataModal
```

## 🔒 **Security & Privacy**

- **Row Level Security (RLS)** on all new tables
- **User isolation** - users can only access their own data
- **Source image privacy** - stored in user-specific folders
- **Audit trail** for compliance and debugging

## 🎯 **Usage Examples**

### Viewing Stitch Generation Metadata
```typescript
// User clicks "Info" on a Stitch-generated image
<UnifiedMediaMetadataModal
  isOpen={true}
  mediaId="generation-id"
  mediaSource="gallery"
/>
// Shows: source images, prompts, cinematic params, technical details
```

### Accessing Source Images
```typescript
// API automatically fetches source images for Stitch generations
const { metadata } = await fetch('/api/metadata/unified?id=generation-id');
// metadata.source_images contains all source images with thumbnails
```

### Cross-Reference Tracking
```typescript
// System automatically tracks where media is used
// Can be queried for analytics and insights
```

This system provides a robust, scalable foundation for comprehensive media metadata while maintaining full backward compatibility with the existing system.
