/**
 * Comprehensive Cinematic Parameters for Image/Video Generation
 * 
 * This module defines all cinematic parameters that can be used to construct
 * prompts for AI image and video generation, similar to Frame Set's filtering system.
 */

// Camera Angle Types
export type CameraAngle = 
  | 'high-angle'           // Camera looks down on subject, making them appear smaller/vulnerable
  | 'low-angle'            // Camera looks up at subject, giving them power/dominance
  | 'eye-level'            // Camera at same height as subject's eyes; neutral and natural
  | 'worms-eye-view'       // Extremely low, almost at ground level
  | 'birds-eye-view'       // Overhead shot looking straight down
  | 'dutch-angle'          // Camera tilted to create tension or unease
  | 'over-the-shoulder'    // Camera positioned behind one subject looking at another
  | 'point-of-view'        // Camera represents character's perspective
  | 'canted-angle';        // Slight tilt for dynamic composition

// Lens Type Definitions
export type LensType = 
  | 'wide-angle-24mm'      // Exaggerates perspective, suitable for landscapes
  | 'wide-angle-35mm'      // Slightly wide, good for environmental portraits
  | 'normal-50mm'          // Approximates human vision; versatile
  | 'portrait-85mm'        // Compresses perspective, ideal for portraits
  | 'telephoto-135mm'      // Strong compression, isolates subjects
  | 'telephoto-200mm'      // Extreme compression for distant subjects
  | 'macro-lens'           // Extreme close-ups with fine detail
  | 'fisheye'              // Ultra-wide, high distortion for creative effects
  | 'anamorphic'           // Squeezes wide scene onto narrower sensor
  | 'tilt-shift';          // Selective focus that can miniaturize scenes

// Shot Size Types
export type ShotSize = 
  | 'extreme-close-up'     // Captures small details like eyes or hands
  | 'close-up'             // Shows head and shoulders, emphasizes emotion
  | 'medium-close-up'      // Shows head and upper chest
  | 'medium-shot'          // Frames subject from waist up
  | 'medium-long-shot'     // Shows subject from knees up
  | 'wide-shot'            // Shows full body and environment
  | 'extreme-wide-shot'    // Emphasizes environment over subject
  | 'establishing-shot';   // Sets the scene and location

// Depth of Field Types
export type DepthOfField = 
  | 'shallow-focus'        // Only subject is sharp, background heavily blurred
  | 'deep-focus'           // Both foreground and background are sharp
  | 'rack-focus'           // Focus shifts during shot from one subject to another
  | 'tilt-shift-effect'    // Selective focus that miniaturizes scene
  | 'bokeh-heavy'          // Very shallow DOF with prominent background blur
  | 'hyperfocal';          // Maximum depth of field for landscape photography

// Composition Techniques
export type CompositionTechnique = 
  | 'rule-of-thirds'       // Subject positioned along thirds lines
  | 'central-framing'      // Subject placed at center; symmetrical and formal
  | 'symmetry'             // Balanced composition with mirrored elements
  | 'leading-lines'        // Lines guide viewer's eye toward subject
  | 'negative-space'       // Empty areas create breathing room
  | 'golden-ratio'         // Composition follows Fibonacci spiral
  | 'diagonal-composition' // Dynamic diagonal lines
  | 'frame-within-frame'   // Using elements to frame the subject
  | 'triangular-composition' // Elements arranged in triangular pattern
  | 'radial-composition';   // Elements radiate from central point

// Lighting Styles
export type LightingStyle = 
  | 'natural-light'        // Sunlight or available light without artificial sources
  | 'high-key'             // Bright, evenly lit with minimal shadows
  | 'low-key'              // Dominated by dark tones with strong shadows
  | 'chiaroscuro'          // Contrast between light and dark for dramatic effect
  | 'backlit-silhouette'  // Light source behind subject creates silhouette
  | 'rim-lighting'         // Light from behind creates edge definition
  | 'side-lighting'        // Light from the side creates depth and texture
  | 'top-lighting'         // Light from above creates dramatic shadows
  | 'bottom-lighting'      // Light from below creates eerie, unnatural look
  | 'colored-gels'         // Colored lights (neon pink, blue, etc.)
  | 'practical-lighting'    // Using visible light sources in the scene
  | 'hard-light'           // Sharp, defined shadows
  | 'soft-light'           // Diffused, gentle shadows
  | 'mixed-lighting'        // Combination of different light sources
  | 'volumetric-lighting';  // Visible light rays/beams

// Color Palette/Grading
export type ColorPalette = 
  | 'warm-golden'          // Oranges, yellows, reds; evokes warmth/nostalgia
  | 'cool-blue'           // Blues and greens; creates somber/futuristic feel
  | 'monochrome'           // Black and white; emphasizes texture/contrast
  | 'sepia'                // Brownish tones reminiscent of aged photographs
  | 'desaturated'          // Muted colors for realism or melancholy
  | 'high-saturation'      // Vivid, punchy colors
  | 'pastel'               // Soft, muted colors
  | 'neon'                 // Bright, electric colors
  | 'earth-tones'          // Natural browns, greens, tans
  | 'jewel-tones'          // Rich, deep colors like emerald, ruby, sapphire
  | 'film-stock-emulation' // Specific color profiles (Kodak Portra, Fuji Velvia)
  | 'teal-and-orange'      // Popular cinematic color grading
  | 'split-toning'         // Different colors for highlights and shadows
  | 'cross-processing'     // Unconventional color processing
  | 'vintage-wash';        // Aged, faded color treatment

// Director/Cinematographer Styles
export type DirectorStyle = 
  | 'wes-anderson'         // Symmetrical framing, pastel colors, meticulous design
  | 'roger-deakins'        // Naturalistic lighting, epic landscapes, careful shadows
  | 'christopher-doyle'    // Expressive handheld movement, saturated neon colors
  | 'david-fincher'        // Desaturated palettes, precise camera movement, clean lines
  | 'sofia-coppola'        // Dreamy atmospheres, soft pastel hues, youthful interiors
  | 'stanley-kubrick'      // One-point perspective, symmetrical compositions
  | 'terrence-malick'      // Natural lighting, handheld camera, poetic imagery
  | 'paul-thomas-anderson' // Long takes, complex camera movements
  | 'denis-villeneuve'     // Minimalist compositions, muted colors
  | 'emmanuel-lubezki'     // Natural lighting, long takes, immersive cinematography
  | 'janusz-kaminski'      // High contrast, desaturated colors, dramatic lighting
  | 'robert-richardson'    // Bold colors, dramatic lighting, wide compositions
  | 'darius-khondji'       // Moody lighting, rich colors, atmospheric
  | 'bruno-delbonnel'      // Warm colors, soft lighting, romantic atmosphere
  | 'seamus-mcgarvey';     // Natural lighting, handheld camera, intimate feel

// Era or Film Stock Emulation
export type EraEmulation = 
  | 'vintage-16mm-grain'    // Coarse grain and muted colors
  | 'super-8'              // Home-movie aesthetic with streaks and faded tones
  | '1970s-bleach-bypass'  // High contrast, desaturated colors
  | '1980s-vhs'            // Low resolution, color bleeding, scan lines
  | '1990s-film'           // Balanced colors with subtle grain
  | 'kodak-portra-400'     // Balanced colors and soft contrast
  | 'fuji-velvia-50'       // Vivid saturation and punchy contrast
  | 'kodak-tri-x'          // High contrast black and white
  | 'ilford-hp5'           // Fine grain black and white
  | 'polaroid-instant'     // Soft colors, slight vignetting
  | 'lomography'           // Artistic imperfections, color shifts
  | 'daguerreotype'        // Early photographic process aesthetic
  | 'tintype'              // Metallic sheen, high contrast
  | 'cyanotype'            // Blue-toned monochrome
  | 'sepia-toned';         // Warm brown monochrome

// Scene Mood
export type SceneMood = 
  | 'gritty'                // Dark, textured visuals; often desaturated
  | 'dreamlike'             // Soft focus, haze, pastel colors
  | 'futuristic'            // Sleek lines, cool color palettes, neon lights
  | 'romantic'              // Warm tones, soft lighting, intimate composition
  | 'action-packed'         // Dynamic camera angles and motion blur
  | 'film-noir'             // High contrast, Venetian blind shadows
  | 'melancholic'           // Subdued colors, soft lighting, contemplative
  | 'mysterious'            // Dark tones, dramatic shadows, enigmatic
  | 'nostalgic'             // Warm colors, soft focus, vintage elements
  | 'dramatic'              // High contrast, bold compositions, intense
  | 'peaceful'              // Soft colors, gentle lighting, serene
  | 'tense'                 // Sharp angles, harsh lighting, claustrophobic
  | 'epic'                  // Wide compositions, dramatic lighting, grand scale
  | 'intimate'              // Close compositions, soft lighting, personal
  | 'surreal'               // Unusual compositions, unexpected elements
  | 'minimalist'            // Clean lines, simple compositions, reduced elements
  | 'baroque'               // Ornate, complex compositions, rich details
  | 'industrial'            // Harsh lighting, metallic surfaces, urban decay
  | 'natural'               // Organic shapes, natural lighting, earthy tones
  | 'ethereal';             // Soft, otherworldly, luminous

// Camera Movement
export type CameraMovement = 
  | 'static'                // Camera does not move
  | 'pan-left'              // Horizontal rotation left
  | 'pan-right'             // Horizontal rotation right
  | 'tilt-up'               // Vertical rotation up
  | 'tilt-down'             // Vertical rotation down
  | 'handheld'              // Organically shaky movement
  | 'tracking-forward'      // Camera moves smoothly forward
  | 'tracking-backward'     // Camera moves smoothly backward
  | 'tracking-left'         // Camera moves smoothly left
  | 'tracking-right'        // Camera moves smoothly right
  | 'dolly-in'              // Camera moves toward subject
  | 'dolly-out'             // Camera moves away from subject
  | 'crane-up'              // Camera moves vertically up
  | 'crane-down'            // Camera moves vertically down
  | 'orbit-clockwise'       // Camera circles around subject clockwise
  | 'orbit-counterclockwise' // Camera circles around subject counterclockwise
  | 'zoom-in'               // Lens zoom toward subject
  | 'zoom-out'              // Lens zoom away from subject
  | 'push-pull'             // Combination of dolly and zoom
  | 'whip-pan'              // Fast horizontal movement
  | 'snap-zoom'             // Quick zoom in or out
  | 'floating'              // Smooth, floating movement
  | 'shaky'                 // Intentionally unsteady movement
  | 'smooth'                // Very steady, controlled movement
  | 'jerky'                 // Sudden, abrupt movements
  | 'spiral'                // Spiral movement around subject
  | 'figure-eight'          // Figure-eight movement pattern
  | 'pendulum'              // Back and forth swinging movement
  | 'free-fall'             // Downward movement
  | 'ascending';            // Upward movement

// Aspect Ratio/Frame Size
export type AspectRatio = 
  | '1:1'                   // Square frame, social media
  | '4:3'                   // Classic television and early cinema
  | '16:9'                  // Standard widescreen for modern video
  | '21:9'                  // Ultra-wide cinematic
  | '2.39:1'                // Cinemascope anamorphic widescreen
  | '2.35:1'                // Standard anamorphic widescreen
  | '1.85:1'                // Academy flat widescreen
  | '9:16'                  // Vertical video for mobile platforms
  | '3:2'                   // Standard photography aspect ratio
  | '5:4'                   // Large format photography
  | '6:7'                   // Medium format photography
  | 'golden-ratio'          // 1.618:1 golden ratio
  | 'cinema-scope'          // 2.35:1 cinema scope
  | 'vista-vision'          // 1.85:1 vista vision
  | 'imax'                  // 1.43:1 IMAX format
  | 'full-frame'            // 3:2 full frame sensor
  | 'aps-c'                 // 3:2 APS-C sensor
  | 'micro-four-thirds'     // 4:3 micro four thirds
  | 'medium-format'         // 6:7 medium format
  | 'large-format';         // 5:4 large format

// Time & Setting
export type TimeSetting = 
  | 'dawn'                  // Early morning, soft golden light
  | 'morning'               // Bright morning light
  | 'midday'                // Harsh overhead light
  | 'afternoon'             // Warm afternoon light
  | 'golden-hour'           // Warm, soft light before sunset
  | 'sunset'                // Dramatic orange and red light
  | 'dusk'                  // Dimming light, blue hour
  | 'twilight'              // Between day and night
  | 'night'                 // Dark with artificial lighting
  | 'midnight'              // Deepest night
  | 'blue-hour'             // Blue-tinted light after sunset
  | 'magic-hour'            // Optimal lighting conditions
  | 'high-noon'             // Bright, harsh midday sun
  | 'late-afternoon'        // Warm, angled light
  | 'early-evening'         // Transitioning to night
  | 'late-night'            // Deep night with minimal light
  | 'pre-dawn'              // Very early morning
  | 'post-sunset'           // After sunset, before full dark
  | 'overcast-day'          // Cloudy, diffused light
  | 'stormy-weather';       // Dramatic, changing light

export type WeatherCondition = 
  | 'sunny'                 // Clear skies, bright light
  | 'partly-cloudy'         // Mix of sun and clouds
  | 'overcast'              // Cloudy, diffused light
  | 'foggy'                 // Misty, atmospheric
  | 'rainy'                 // Wet, reflective surfaces
  | 'stormy'                // Dramatic, changing conditions
  | 'snowy'                 // Cold, bright, clean
  | 'windy'                 // Moving elements, dynamic
  | 'humid'                 // Moist, hazy atmosphere
  | 'dry'                   // Clear, crisp conditions
  | 'hazy'                  // Soft, diffused light
  | 'crisp'                 // Clear, sharp conditions
  | 'misty'                 // Soft, mysterious atmosphere
  | 'drizzly'               // Light rain, moody
  | 'torrential'            // Heavy rain, dramatic
  | 'blizzard'              // Heavy snow, whiteout
  | 'sandstorm'             // Dusty, obscured conditions
  | 'heat-wave'             // Hot, shimmering air
  | 'freezing'              // Cold, crisp conditions
  | 'tropical';             // Warm, humid conditions

export type LocationType = 
  | 'urban-street'          // City street with buildings
  | 'rural-field'           // Open countryside
  | 'forest'                // Wooded area
  | 'desert'                // Arid landscape
  | 'mountain'              // Elevated terrain
  | 'beach'                 // Coastal area
  | 'lake'                  // Freshwater body
  | 'ocean'                 // Seawater body
  | 'park'                  // Urban green space
  | 'garden'                // Cultivated outdoor space
  | 'rooftop'               // Elevated urban space
  | 'alleyway'              // Narrow urban passage
  | 'highway'               // Major road
  | 'bridge'                // Overpass or water crossing
  | 'tunnel'                // Underground passage
  | 'courtyard'             // Enclosed outdoor space
  | 'plaza'                 // Open urban square
  | 'marketplace'           // Commercial outdoor area
  | 'playground'            // Recreational outdoor space
  | 'cemetery'              // Burial ground
  | 'ruins'                 // Abandoned structures
  | 'construction-site'     // Building in progress
  | 'industrial-area'       // Manufacturing zone
  | 'residential-neighborhood' // Housing area
  | 'downtown'              // City center
  | 'suburb'                // Residential outskirts
  | 'waterfront'            // Water-adjacent area
  | 'skyline'               // City horizon view
  | 'countryside'            // Rural landscape
  | 'wilderness';           // Untamed natural area

// Additional Details
export type ForegroundElement = 
  | 'raindrops-on-window'   // Water droplets on glass
  | 'tree-branches'        // Overhanging foliage
  | 'lens-flare'            // Light artifacts
  | 'smoke'                 // Atmospheric smoke
  | 'dust-particles'        // Floating dust
  | 'snowflakes'            // Falling snow
  | 'leaves'                // Falling or floating leaves
  | 'insects'               // Flying insects
  | 'birds'                 // Flying birds
  | 'shadows'               // Cast shadows
  | 'reflections'           // Surface reflections
  | 'steam'                 // Rising vapor
  | 'fog'                   // Atmospheric fog
  | 'mist'                  // Light atmospheric moisture
  | 'haze'                  // Atmospheric haze
  | 'glare'                 // Bright light reflection
  | 'bloom'                 // Light bloom effect
  | 'vignette'              // Darkened edges
  | 'grain'                 // Film grain texture
  | 'scratches'             // Surface imperfections
  | 'water-drops'           // Water droplets
  | 'sparkles'              // Light sparkles
  | 'bokeh-lights'          // Out-of-focus light sources
  | 'light-streaks'         // Moving light trails
  | 'particles'             // Floating particles
  | 'texture-overlay'       // Surface texture
  | 'color-fringe'          // Chromatic aberration
  | 'lens-distortion'      // Optical distortion
  | 'focus-breathing'       // Focus shift effect
  | 'motion-blur';          // Movement blur

export type SubjectCount = 
  | 'solo'                  // Single subject
  | 'pair'                  // Two subjects
  | 'small-group'           // 3-5 subjects
  | 'medium-group'          // 6-10 subjects
  | 'large-group'           // 11-20 subjects
  | 'crowd'                 // Many subjects
  | 'empty'                 // No visible subjects
  | 'multiple'               // Several subjects
  | 'duo'                    // Two people
  | 'ensemble';              // Group of people

export type EyeContact = 
  | 'direct-gaze'           // Looking directly at camera
  | 'profile-view'          // Side view of subject
  | 'looking-away'          // Subject looking elsewhere
  | 'looking-down'          // Subject looking down
  | 'looking-up'            // Subject looking up
  | 'looking-left'          // Subject looking left
  | 'looking-right'         // Subject looking right
  | 'eyes-closed'           // Subject's eyes are closed
  | 'partial-face'          // Only part of face visible
  | 'back-of-head';         // Subject facing away

// Main Cinematic Parameters Interface
export interface CinematicParameters {
  // Core cinematic elements
  cameraAngle?: CameraAngle;
  lensType?: LensType;
  shotSize?: ShotSize;
  depthOfField?: DepthOfField;
  compositionTechnique?: CompositionTechnique;
  lightingStyle?: LightingStyle;
  colorPalette?: ColorPalette;
  directorStyle?: DirectorStyle;
  eraEmulation?: EraEmulation;
  sceneMood?: SceneMood;
  cameraMovement?: CameraMovement;
  aspectRatio?: AspectRatio;
  
  // Time and setting
  timeSetting?: TimeSetting;
  weatherCondition?: WeatherCondition;
  locationType?: LocationType;
  
  // Additional details
  foregroundElements?: ForegroundElement[];
  subjectCount?: SubjectCount;
  eyeContact?: EyeContact;
  
  // Technical metadata
  enhancementType?: string;
  enhancementPrompt?: string;
  aiProvider?: string;
  generationCost?: number;
  generatedAt?: string;
}

// Prompt construction helper types
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  parameters: Partial<CinematicParameters>;
  examplePrompt: string;
  category: 'portrait' | 'landscape' | 'street' | 'cinematic' | 'artistic' | 'commercial';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

// Search and filter types
export interface CinematicFilter {
  cameraAngles?: CameraAngle[];
  lensTypes?: LensType[];
  directorStyles?: DirectorStyle[];
  colorPalettes?: ColorPalette[];
  sceneMoods?: SceneMood[];
  aspectRatios?: AspectRatio[];
  timeSettings?: TimeSetting[];
  weatherConditions?: WeatherCondition[];
  locationTypes?: LocationType[];
}

// API request/response types
export interface CinematicEnhancementRequest {
  inputImageUrl: string;
  enhancementType: string;
  prompt: string;
  cinematicParameters: Partial<CinematicParameters>;
  strength?: number;
  moodboardId?: string;
}

export interface CinematicEnhancementResponse {
  success: boolean;
  enhancedUrl?: string;
  taskId?: string;
  cost: number;
  cinematicMetadata: CinematicParameters;
  error?: string;
}

// Utility functions for parameter validation and prompt construction
export const CINEMATIC_PARAMETERS = {
  CAMERA_ANGLES: [
    'high-angle', 'low-angle', 'eye-level', 'worms-eye-view', 'birds-eye-view',
    'dutch-angle', 'over-the-shoulder', 'point-of-view', 'canted-angle'
  ] as const,
  
  LENS_TYPES: [
    'wide-angle-24mm', 'wide-angle-35mm', 'normal-50mm', 'portrait-85mm',
    'telephoto-135mm', 'telephoto-200mm', 'macro-lens', 'fisheye',
    'anamorphic', 'tilt-shift'
  ] as const,
  
  SHOT_SIZES: [
    'extreme-close-up', 'close-up', 'medium-close-up', 'medium-shot',
    'medium-long-shot', 'wide-shot', 'extreme-wide-shot', 'establishing-shot'
  ] as const,
  
  LIGHTING_STYLES: [
    'natural-light', 'high-key', 'low-key', 'chiaroscuro', 'backlit-silhouette',
    'rim-lighting', 'side-lighting', 'top-lighting', 'bottom-lighting',
    'colored-gels', 'practical-lighting', 'hard-light', 'soft-light',
    'mixed-lighting', 'volumetric-lighting'
  ] as const,
  
  DIRECTOR_STYLES: [
    'wes-anderson', 'roger-deakins', 'christopher-doyle', 'david-fincher',
    'sofia-coppola', 'stanley-kubrick', 'terrence-malick', 'paul-thomas-anderson',
    'denis-villeneuve', 'emmanuel-lubezki', 'janusz-kaminski', 'robert-richardson',
    'darius-khondji', 'bruno-delbonnel', 'seamus-mcgarvey'
  ] as const,
  
  COLOR_PALETTES: [
    'warm-golden', 'cool-blue', 'monochrome', 'sepia', 'desaturated',
    'high-saturation', 'pastel', 'neon', 'earth-tones', 'jewel-tones',
    'film-stock-emulation', 'teal-and-orange', 'split-toning', 'cross-processing',
    'vintage-wash'
  ] as const,
  
  SCENE_MOODS: [
    'gritty', 'dreamlike', 'futuristic', 'romantic', 'action-packed',
    'film-noir', 'melancholic', 'mysterious', 'nostalgic', 'dramatic',
    'peaceful', 'tense', 'epic', 'intimate', 'surreal', 'minimalist',
    'baroque', 'industrial', 'natural', 'ethereal'
  ] as const
} as const;

export default CinematicParameters;
