# Cinematic Parameters Implementation

This document outlines the comprehensive implementation of cinematic parameters for image/video generation, similar to Frame Set's filtering system. The implementation adds rich metadata capabilities to your existing NanoBanana and Seedream V4 integration.

## Overview

The cinematic parameters system allows users to specify detailed cinematic qualities for AI-generated images, including camera angles, lens types, lighting styles, director aesthetics, and more. These parameters are stored as metadata and can be used for filtering, searching, and prompt construction.

## Architecture

### 1. Database Schema

**Migration**: `supabase/migrations/086_add_cinematic_metadata_to_media.sql`

- Adds `ai_metadata` JSONB column to `media` table
- Creates GIN indexes for efficient querying
- Adds computed `cinematic_tags` column for full-text search
- Includes function to extract cinematic tags from metadata

### 2. Type Definitions

**File**: `packages/types/src/cinematic-parameters.ts`

Comprehensive TypeScript types for all cinematic parameters:
- Camera angles (high-angle, low-angle, dutch-angle, etc.)
- Lens types (24mm wide-angle, 85mm portrait, anamorphic, etc.)
- Lighting styles (chiaroscuro, rim-lighting, colored-gels, etc.)
- Director styles (Wes Anderson, Roger Deakins, David Fincher, etc.)
- Color palettes (warm-golden, cool-blue, monochrome, etc.)
- Scene moods (romantic, dramatic, gritty, futuristic, etc.)
- And many more...

### 3. Prompt Construction Service

**File**: `packages/services/src/cinematic-prompt-builder.ts`

The `CinematicPromptBuilder` class:
- Combines user prompts with cinematic parameters
- Generates technical descriptions for each parameter
- Constructs comprehensive prompts for AI providers
- Provides template generation for common scenarios
- Estimates token usage and manages prompt length

### 4. Enhanced API Endpoints

#### Enhancement API v2
**File**: `apps/web/app/api/enhance-image-v2/route.ts`

Enhanced version of the image enhancement API that:
- Accepts cinematic parameters in requests
- Uses `CinematicPromptBuilder` to construct prompts
- Stores cinematic metadata in the database
- Returns constructed prompt details

#### Cinematic Search API
**File**: `apps/web/app/api/search-cinematic/route.ts`

New API endpoint for searching and filtering images by cinematic metadata:
- Supports complex filtering by multiple parameters
- Provides full-text search on cinematic tags
- Returns filter options for UI components
- Handles pagination and sorting

### 5. UI Components

#### Cinematic Parameter Selector
**File**: `apps/web/app/components/cinematic/CinematicParameterSelector.tsx`

Interactive component for selecting cinematic parameters:
- Tabbed interface for different parameter categories
- Compact and full modes
- Template generation buttons
- Real-time parameter preview
- Active parameters summary

#### Cinematic Search Filter
**File**: `apps/web/app/components/cinematic/CinematicSearchFilter.tsx`

Advanced search and filtering component:
- Multi-select filters for each parameter type
- Real-time search with debouncing
- Active filters display
- Filter options loaded from API
- Compact and full modes

#### Enhanced Playground
**File**: `apps/web/app/components/playground/EnhancedCinematicPlayground.tsx`

Complete playground interface integrating:
- Image enhancement with cinematic parameters
- Search and browse cinematic gallery
- Template selection and customization
- Real-time preview and controls

## Usage Examples

### 1. Basic Enhancement with Cinematic Parameters

```typescript
const request = {
  inputImageUrl: "https://example.com/image.jpg",
  enhancementType: "cinematic",
  prompt: "dramatic portrait",
  cinematicParameters: {
    cameraAngle: "low-angle",
    lensType: "portrait-85mm",
    lightingStyle: "chiaroscuro",
    sceneMood: "dramatic",
    directorStyle: "david-fincher",
    colorPalette: "desaturated"
  },
  strength: 0.8
};

const response = await fetch('/api/enhance-image-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});
```

### 2. Searching Cinematic Images

```typescript
const searchRequest = {
  searchQuery: "wes anderson",
  filters: {
    directorStyles: ["wes-anderson"],
    colorPalettes: ["pastel"],
    sceneMoods: ["nostalgic"]
  },
  limit: 20
};

const response = await fetch('/api/search-cinematic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(searchRequest)
});
```

### 3. Using the Prompt Builder

```typescript
import CinematicPromptBuilder from './cinematic-prompt-builder';

const builder = new CinematicPromptBuilder();
const result = builder.constructPrompt({
  basePrompt: "portrait of a person",
  cinematicParameters: {
    cameraAngle: "eye-level",
    lensType: "portrait-85mm",
    lightingStyle: "soft-light",
    sceneMood: "romantic"
  },
  enhancementType: "portrait"
});

console.log(result.fullPrompt);
// Output: "portrait of a person. eye-level shot, 85mm portrait lens, soft light, romantic mood"
```

## Database Queries

### 1. Find Images by Director Style

```sql
SELECT * FROM media 
WHERE ai_metadata->>'directorStyle' = 'wes-anderson'
AND visibility = 'public';
```

### 2. Search by Multiple Cinematic Tags

```sql
SELECT * FROM media 
WHERE cinematic_tags && ARRAY['camera-angle:low-angle', 'lighting-style:chiaroscuro']
AND visibility = 'public';
```

### 3. Get Filter Options

```sql
SELECT DISTINCT ai_metadata->>'cameraAngle' as camera_angle
FROM media 
WHERE ai_metadata->>'cameraAngle' IS NOT NULL
AND visibility = 'public';
```

## Integration with Existing Systems

### 1. Credit System
- Each cinematic enhancement costs 1 credit (same as current system)
- Advanced parameters (director styles, custom filters) can be Pro-only features
- Marketplace visibility enhanced with cinematic filtering

### 2. Moodboard Integration
- Cinematic parameters can be applied to moodboard generation
- Search moodboards by cinematic style
- Template moodboards for different cinematic aesthetics

### 3. Showcase System
- Filter showcases by cinematic parameters
- Enhanced search capabilities
- Cinematic style recommendations

## Business Benefits

### 1. Enhanced User Experience
- Professional-grade parameter control
- Intuitive template system
- Advanced search and discovery

### 2. Competitive Advantage
- Frame Set-like filtering capabilities
- Rich metadata for content organization
- Professional cinematic quality

### 3. Monetization Opportunities
- Pro features for advanced parameters
- Cinematic style packs
- Professional templates

## Future Enhancements

### 1. AI-Powered Suggestions
- Analyze user preferences to suggest parameters
- Auto-generate cinematic parameters from image analysis
- Style transfer between images

### 2. Community Features
- Share cinematic parameter presets
- Rate and review cinematic styles
- Collaborative moodboard creation

### 3. Advanced Analytics
- Track popular cinematic styles
- Analyze enhancement success rates
- User behavior insights

## Technical Considerations

### 1. Performance
- GIN indexes for fast JSONB queries
- Computed columns for common searches
- Efficient pagination

### 2. Scalability
- Modular parameter system
- Easy addition of new parameters
- Flexible prompt construction

### 3. Maintainability
- Type-safe parameter definitions
- Centralized prompt building logic
- Reusable UI components

## Getting Started

1. **Run the database migration**:
   ```bash
   # Apply the cinematic metadata migration
   supabase migration up
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Use the enhanced API**:
   ```typescript
   // Use the new v2 enhancement API
   const response = await fetch('/api/enhance-image-v2', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       inputImageUrl: 'your-image-url',
       enhancementType: 'cinematic',
       prompt: 'your-prompt',
       cinematicParameters: {
         cameraAngle: 'low-angle',
         directorStyle: 'wes-anderson'
       }
     })
   });
   ```

4. **Integrate UI components**:
   ```tsx
   import CinematicParameterSelector from './components/cinematic/CinematicParameterSelector';
   
   <CinematicParameterSelector
     parameters={cinematicParams}
     onParametersChange={setCinematicParams}
     showAdvanced={true}
   />
   ```

## Conclusion

This implementation provides a comprehensive cinematic parameters system that enhances your existing image generation capabilities. The modular architecture allows for easy extension and customization, while the rich metadata system enables powerful search and filtering capabilities similar to Frame Set.

The system is designed to grow with your platform, providing both immediate value through enhanced image quality and long-term benefits through improved content organization and discovery.
