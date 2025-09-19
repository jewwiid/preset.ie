# Cinematic Parameters Integration Examples

This document shows how to integrate cinematic parameters into your existing image/video generation flow.

## 🎬 How It Works

### 1. **User Experience Flow**

```
User Input: "portrait of a person"
↓
Cinematic Parameters Selected:
- Camera Angle: low-angle
- Lens Type: portrait-85mm
- Lighting: chiaroscuro
- Director Style: david-fincher
- Scene Mood: dramatic
↓
Enhanced Prompt Generated:
"portrait of a person. low-angle shot, 85mm portrait lens, chiaroscuro lighting, in the style of David Fincher, dramatic atmosphere"
↓
AI Generation with Enhanced Prompt
↓
Metadata Stored: All cinematic parameters saved to database
```

### 2. **API Integration**

#### Basic Generation (Current)
```typescript
// Current API call
const response = await fetch('/api/playground/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "portrait of a person",
    style: "photorealistic",
    resolution: "1024x1024",
    numImages: 1
  })
});
```

#### Cinematic Generation (Enhanced)
```typescript
// Enhanced API call with cinematic parameters
const response = await fetch('/api/playground/generate-cinematic', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "portrait of a person",
    style: "photorealistic", 
    resolution: "1024x1024",
    numImages: 1,
    cinematicParameters: {
      cameraAngle: "low-angle",
      lensType: "portrait-85mm",
      lightingStyle: "chiaroscuro",
      directorStyle: "david-fincher",
      sceneMood: "dramatic"
    }
  })
});
```

### 3. **UI Component Integration**

#### Replace Existing Generation Panel
```tsx
// In your playground page
import CinematicGenerationPanel from './components/playground/CinematicGenerationPanel';

// Replace UnifiedImageGenerationPanel with:
<CinematicGenerationPanel
  onGenerate={async (params) => {
    // Handle generation with cinematic parameters
    const response = await fetch('/api/playground/generate-cinematic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const data = await response.json();
    // Handle results...
  }}
  loading={isGenerating}
  userCredits={userCredits}
  // ... other props
/>
```

#### Add Cinematic Controls to Existing Panel
```tsx
// In your existing UnifiedImageGenerationPanel
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector';

// Add cinematic parameters state
const [cinematicParameters, setCinematicParameters] = useState({});
const [enableCinematicMode, setEnableCinematicMode] = useState(false);

// Add to your form
<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Switch
      checked={enableCinematicMode}
      onCheckedChange={setEnableCinematicMode}
    />
    <Label>Enable Cinematic Mode</Label>
  </div>
  
  {enableCinematicMode && (
    <CinematicParameterSelector
      parameters={cinematicParameters}
      onParametersChange={setCinematicParameters}
      compact={true}
    />
  )}
</div>
```

### 4. **Video Generation Integration**

#### Enhanced Video API
```typescript
// For video generation with cinematic parameters
const response = await fetch('/api/playground/video', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "person walking through city",
    cinematicParameters: {
      cameraAngle: "tracking-forward",
      lensType: "wide-angle-35mm",
      lightingStyle: "golden-hour",
      directorStyle: "terrence-malick",
      sceneMood: "peaceful",
      cameraMovement: "smooth-tracking"
    }
  })
});
```

### 5. **Style Preset Integration**

#### Enhanced Style Presets
```typescript
// Style presets can now include cinematic parameters
const cinematicStylePresets = [
  {
    id: "wes-anderson-portrait",
    name: "Wes Anderson Portrait",
    prompt_template: "portrait of {subject}",
    cinematicParameters: {
      cameraAngle: "eye-level",
      lensType: "portrait-85mm",
      lightingStyle: "soft-light",
      directorStyle: "wes-anderson",
      sceneMood: "nostalgic",
      colorPalette: "pastel"
    }
  },
  {
    id: "fincher-noir",
    name: "Fincher Noir",
    prompt_template: "{subject} in dramatic lighting",
    cinematicParameters: {
      cameraAngle: "low-angle",
      lensType: "anamorphic",
      lightingStyle: "chiaroscuro",
      directorStyle: "david-fincher",
      sceneMood: "mysterious",
      colorPalette: "desaturated"
    }
  }
];
```

### 6. **Search and Discovery**

#### Search Generated Images
```typescript
// Search images by cinematic parameters
const searchResponse = await fetch('/api/search-cinematic', {
  method: 'POST',
  body: JSON.stringify({
    searchQuery: "david fincher",
    filters: {
      directorStyles: ["david-fincher"],
      sceneMoods: ["dramatic", "mysterious"],
      lightingStyles: ["chiaroscuro", "low-key"]
    }
  })
});
```

### 7. **Moodboard Integration**

#### Cinematic Moodboards
```typescript
// Create moodboards with cinematic themes
const moodboardResponse = await fetch('/api/moodboards', {
  method: 'POST',
  body: JSON.stringify({
    title: "Wes Anderson Aesthetic",
    cinematicTheme: {
      directorStyle: "wes-anderson",
      colorPalette: "pastel",
      sceneMood: "nostalgic",
      cameraAngle: "eye-level"
    }
  })
});
```

## 🚀 Implementation Steps

### Step 1: Update Generation APIs
1. Modify existing generation endpoints to accept `cinematicParameters`
2. Use `CinematicPromptBuilder` to enhance prompts
3. Store cinematic metadata in database

### Step 2: Enhance UI Components
1. Add cinematic parameter controls to generation panels
2. Show enhanced prompt previews
3. Add quick template buttons

### Step 3: Update Search System
1. Enable filtering by cinematic parameters
2. Add cinematic tags to search results
3. Create cinematic style galleries

### Step 4: Integrate with Existing Features
1. Apply cinematic parameters to style presets
2. Enhance moodboard generation with cinematic themes
3. Add cinematic parameters to showcase filtering

## 📊 Benefits

### For Users
- **Professional Quality**: Cinematic-grade image generation
- **Easy Control**: Intuitive parameter selection
- **Quick Templates**: One-click professional styles
- **Better Discovery**: Search by cinematic style

### For Platform
- **Competitive Advantage**: Frame Set-like capabilities
- **Rich Metadata**: Better content organization
- **Premium Features**: Advanced parameters for Pro users
- **Enhanced Search**: Powerful filtering capabilities

## 🔧 Technical Details

### Prompt Enhancement
```typescript
// Before: "portrait of a person"
// After: "portrait of a person. low-angle shot, 85mm portrait lens, chiaroscuro lighting, in the style of David Fincher, dramatic atmosphere"
```

### Metadata Storage
```json
{
  "cameraAngle": "low-angle",
  "lensType": "portrait-85mm",
  "lightingStyle": "chiaroscuro",
  "directorStyle": "david-fincher",
  "sceneMood": "dramatic",
  "enhancementPrompt": "portrait of a person. low-angle shot...",
  "aiProvider": "wavespeed-seedream-v4",
  "generationCost": 0.025,
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

### Database Queries
```sql
-- Find images by director style
SELECT * FROM media 
WHERE ai_metadata->>'directorStyle' = 'wes-anderson';

-- Search by multiple cinematic tags
SELECT * FROM media 
WHERE cinematic_tags && ARRAY['camera-angle:low-angle', 'lighting-style:chiaroscuro'];
```

This integration provides a seamless way to add professional cinematic capabilities to your existing generation flow while maintaining backward compatibility with current features.
