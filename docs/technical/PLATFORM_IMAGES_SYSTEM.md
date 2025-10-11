# Platform Images System

This document describes the new platform images system that enables browser-side caching of homepage images and visual aids for predefined presets.

## Overview

The system consists of three main components:

1. **Database Schema** - Stores platform-wide images and their metadata
2. **Browser Cache** - Intelligent caching system for better performance
3. **React Components** - UI components for displaying cached images with visual aids

## Features

### 🏠 Homepage Images
- **Browser Caching**: Homepage images are cached in the browser for up to 1 week
- **Fallback Support**: Graceful fallback to default images if cached images fail to load
- **Performance**: Images are preloaded on app startup for better user experience

### 🎨 Preset Visual Aids
- **Visual Examples**: Each predefined preset (Portrait, Landscape, Cinematic, etc.) has visual examples
- **Smart Caching**: Visual aids are cached for 3 days with intelligent refresh logic
- **Interactive UI**: Users can preview examples and see how presets will affect their images

### 📊 Admin Management
- **Admin Interface**: Full CRUD operations for managing platform images
- **Cache Statistics**: Real-time cache performance monitoring
- **Bulk Operations**: Clear cache, refresh images, manage visual aids

## Database Schema

### `platform_images` Table
```sql
CREATE TABLE platform_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'homepage_hero'
    image_type VARCHAR(50) NOT NULL, -- 'homepage', 'preset_visual_aid'
    category VARCHAR(100), -- 'cinematic_parameters', etc.
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    title VARCHAR(255),
    description TEXT,
    usage_context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `preset_visual_aids` Table
```sql
CREATE TABLE preset_visual_aids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_key VARCHAR(100) NOT NULL, -- e.g., 'cinematic_portrait'
    platform_image_id UUID NOT NULL REFERENCES platform_images(id),
    visual_aid_type VARCHAR(50) NOT NULL, -- 'parameter_demo', 'style_reference'
    display_title VARCHAR(255),
    display_description TEXT,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `browser_cache_config` Table
```sql
CREATE TABLE browser_cache_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(100) UNIQUE NOT NULL, -- 'homepage_images'
    cache_strategy VARCHAR(50) NOT NULL, -- 'aggressive', 'moderate'
    cache_duration_hours INTEGER DEFAULT 24,
    cache_version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    -- Cache statistics
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_hit TIMESTAMPTZ,
    last_miss TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Platform Images
- `GET /api/platform-images` - Fetch platform images
- `POST /api/platform-images` - Create new platform image (Admin only)
- `PUT /api/platform-images` - Update platform image (Admin only)
- `DELETE /api/platform-images` - Delete platform image (Admin only)

### Preset Visual Aids
- `GET /api/preset-visual-aids` - Fetch visual aids for presets
- `POST /api/preset-visual-aids` - Create visual aid (Admin only)
- `PUT /api/preset-visual-aids` - Update visual aid (Admin only)
- `DELETE /api/preset-visual-aids` - Delete visual aid (Admin only)

## React Hooks

### `usePlatformImages`
```typescript
const { images, loading, error, refresh, preload } = usePlatformImages(
  'homepage' | 'preset_visual_aids',
  presetKey?, // Required for preset visual aids
  options?
)
```

### `useHomepageImages`
```typescript
const { images, loading, error, refresh } = useHomepageImages({
  preload: true,
  forceRefresh: false
})
```

### `usePresetVisualAids`
```typescript
const { images, loading, error, refresh } = usePresetVisualAids('portrait', {
  preload: true
})
```

### `usePreloadCriticalImages`
```typescript
const { preloaded, loading, preload } = usePreloadCriticalImages()
```

## Components

### `PresetVisualAid`
Displays a visual aid for a specific preset with caching and error handling.

```tsx
<PresetVisualAid
  presetKey="portrait"
  presetName="Portrait"
  size="medium"
  showPreview={true}
/>
```

### `PresetVisualAidGrid`
Grid layout for displaying multiple preset visual aids.

```tsx
<PresetVisualAidGrid
  presetKeys={[
    { key: 'portrait', name: 'Portrait' },
    { key: 'landscape', name: 'Landscape' }
  ]}
  size="medium"
/>
```

### `CinematicParametersWithVisualAids`
Enhanced cinematic parameters component with visual aids.

```tsx
<CinematicParametersWithVisualAids
  enableCinematicMode={true}
  cinematicParameters={parameters}
  onParameterChange={setParameters}
/>
```

## Browser Cache Configuration

### Cache Strategies
- **Aggressive**: Long cache duration (1 week to 1 month)
- **Moderate**: Medium cache duration (3 days to 1 week)  
- **Conservative**: Short cache duration (1 day)

### Cache Types
- **homepage_images**: 1 week cache, 50MB limit
- **preset_visual_aids**: 3 days cache, 100MB limit
- **category_icons**: 1 month cache, 20MB limit
- **marketing_images**: 1 week cache, 30MB limit

## Setup Instructions

### 1. Run Database Migration
```bash
# Apply the migration
supabase migration up
```

### 2. Populate Sample Images
```bash
# Run the sample data script
node scripts/populate-sample-images.js
```

### 3. Upload Actual Images
1. Go to `/admin/platform-images`
2. Upload your actual images to your storage solution
3. Update the image URLs in the admin interface

### 4. Test the System
1. Visit the homepage to see cached images
2. Go to the playground and check cinematic parameters
3. Monitor cache statistics in the admin panel

## Usage Examples

### Homepage with Cached Images
```tsx
// In apps/web/app/page.tsx
import { useHomepageImages, usePreloadCriticalImages } from '../hooks/usePlatformImages'

export default function Home() {
  usePreloadCriticalImages()
  const { images: homepageImages } = useHomepageImages({ preload: true })
  
  // Use cached images with fallback
  const heroImage = homepageImages.find(img => img.usage_context?.section === 'hero')
  const heroSrc = heroImage?.url || '/hero-bg.jpeg'
  
  return (
    <Image src={heroSrc} alt="Hero" fill className="object-cover" />
  )
}
```

### Preset Selector with Visual Aids
```tsx
// In your preset selector component
import { PresetVisualAid } from './PresetVisualAid'

const presetButtons = [
  { key: 'portrait', name: 'Portrait' },
  { key: 'landscape', name: 'Landscape' }
]

return (
  <div className="grid grid-cols-2 gap-2">
    {presetButtons.map(preset => (
      <Button key={preset.key} onClick={() => selectPreset(preset.key)}>
        <PresetVisualAid
          presetKey={preset.key}
          presetName={preset.name}
          size="small"
        />
        {preset.name}
      </Button>
    ))}
  </div>
)
```

## Performance Benefits

1. **Faster Load Times**: Images are cached in the browser, reducing server requests
2. **Better UX**: Preloading prevents image loading delays
3. **Reduced Bandwidth**: Cached images don't need to be re-downloaded
4. **Offline Support**: Cached images work even with poor connectivity

## Monitoring and Maintenance

### Cache Statistics
- Total cached images
- Cache size in KB/MB
- Expired images count
- Cache hit rate percentage

### Admin Operations
- Clear specific cache types
- Clear all cache
- Refresh individual images
- Monitor cache performance

## Future Enhancements

1. **Image Optimization**: Automatic compression and format conversion
2. **CDN Integration**: Serve images from CDN for better global performance
3. **Progressive Loading**: Load low-res images first, then high-res
4. **Analytics**: Track which images are most viewed and optimize accordingly
5. **A/B Testing**: Test different images for homepage and presets

## Troubleshooting

### Images Not Loading
1. Check if images exist in the database
2. Verify image URLs are accessible
3. Check browser cache settings
4. Clear cache and refresh

### Cache Not Working
1. Check localStorage is enabled
2. Verify cache configuration
3. Check for JavaScript errors
4. Monitor network requests

### Admin Interface Issues
1. Verify admin permissions
2. Check authentication token
3. Verify database connection
4. Check console for errors
