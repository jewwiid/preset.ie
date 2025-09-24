/**
 * Cinematic Prompt Builder Service
 * 
 * This service constructs comprehensive prompts for AI image/video generation
 * by combining user input with cinematic parameters, similar to Frame Set's system.
 */

import { 
  CinematicParameters, 
  CameraAngle, 
  LensType, 
  ShotSize, 
  DepthOfField,
  CompositionTechnique,
  LightingStyle,
  ColorPalette,
  DirectorStyle,
  EraEmulation,
  SceneMood,
  CameraMovement,
  AspectRatio,
  TimeSetting,
  WeatherCondition,
  LocationType,
  ForegroundElement,
  SubjectCount,
  EyeContact
} from '../../types/src/cinematic-parameters';

export interface PromptConstructionOptions {
  basePrompt: string;
  cinematicParameters: Partial<CinematicParameters>;
  enhancementType: string;
  includeTechnicalDetails?: boolean;
  includeStyleReferences?: boolean;
  maxLength?: number;
  subject?: string; // The subject for cinematic adjustments
}

export interface ConstructedPrompt {
  fullPrompt: string;
  technicalDetails: string[];
  styleReferences: string[];
  cinematicTags: string[];
  estimatedTokens: number;
}

export class CinematicPromptBuilder {
  private readonly MAX_PROMPT_LENGTH = 500;
  private readonly MAX_TECHNICAL_DETAILS = 10;
  private readonly MAX_STYLE_REFERENCES = 5;

  /**
   * Constructs a comprehensive prompt from base prompt and cinematic parameters
   */
  constructPrompt(options: PromptConstructionOptions): ConstructedPrompt {
    const {
      basePrompt,
      cinematicParameters,
      enhancementType,
      includeTechnicalDetails = true,
      includeStyleReferences = true,
      maxLength = this.MAX_PROMPT_LENGTH,
      subject
    } = options;

    const technicalDetails: string[] = [];
    const styleReferences: string[] = [];
    const cinematicTags: string[] = [];

    // Build technical details from cinematic parameters
    if (includeTechnicalDetails) {
      this.addCameraDetails(cinematicParameters, technicalDetails, cinematicTags);
      this.addLightingDetails(cinematicParameters, technicalDetails, cinematicTags);
      this.addCompositionDetails(cinematicParameters, technicalDetails, cinematicTags);
      this.addTechnicalSpecs(cinematicParameters, technicalDetails, cinematicTags);
    }

    // Add style references
    if (includeStyleReferences) {
      this.addStyleReferences(cinematicParameters, styleReferences, cinematicTags);
    }

    // Add environmental and mood details
    this.addEnvironmentalDetails(cinematicParameters, technicalDetails, cinematicTags);
    this.addMoodDetails(cinematicParameters, technicalDetails, cinematicTags);

    // Add subject-aware cinematic adjustments
    if (subject) {
      this.addSubjectAwareAdjustments(subject, cinematicParameters, technicalDetails, cinematicTags);
    }

    // Construct the full prompt
    const fullPrompt = this.assemblePrompt(
      basePrompt,
      technicalDetails,
      styleReferences,
      enhancementType,
      maxLength
    );

    return {
      fullPrompt,
      technicalDetails: technicalDetails.slice(0, this.MAX_TECHNICAL_DETAILS),
      styleReferences: styleReferences.slice(0, this.MAX_STYLE_REFERENCES),
      cinematicTags,
      estimatedTokens: this.estimateTokens(fullPrompt)
    };
  }

  /**
   * Add camera-related technical details
   */
  private addCameraDetails(
    params: Partial<CinematicParameters>,
    technicalDetails: string[],
    cinematicTags: string[]
  ): void {
    if (params.cameraAngle) {
      const angleDescription = this.getCameraAngleDescription(params.cameraAngle);
      technicalDetails.push(angleDescription);
      cinematicTags.push(`camera-angle:${params.cameraAngle}`);
    }

    if (params.lensType) {
      const lensDescription = this.getLensTypeDescription(params.lensType);
      technicalDetails.push(lensDescription);
      cinematicTags.push(`lens-type:${params.lensType}`);
    }

    if (params.shotSize) {
      const shotDescription = this.getShotSizeDescription(params.shotSize);
      technicalDetails.push(shotDescription);
      cinematicTags.push(`shot-size:${params.shotSize}`);
    }

    if (params.depthOfField) {
      const dofDescription = this.getDepthOfFieldDescription(params.depthOfField);
      technicalDetails.push(dofDescription);
      cinematicTags.push(`depth-of-field:${params.depthOfField}`);
    }

    if (params.cameraMovement) {
      const movementDescription = this.getCameraMovementDescription(params.cameraMovement);
      technicalDetails.push(movementDescription);
      cinematicTags.push(`camera-movement:${params.cameraMovement}`);
    }
  }

  /**
   * Add lighting-related technical details
   */
  private addLightingDetails(
    params: Partial<CinematicParameters>,
    technicalDetails: string[],
    cinematicTags: string[]
  ): void {
    if (params.lightingStyle) {
      const lightingDescription = this.getLightingStyleDescription(params.lightingStyle);
      technicalDetails.push(lightingDescription);
      cinematicTags.push(`lighting-style:${params.lightingStyle}`);
    }
  }

  /**
   * Add composition-related technical details
   */
  private addCompositionDetails(
    params: Partial<CinematicParameters>,
    technicalDetails: string[],
    cinematicTags: string[]
  ): void {
    if (params.compositionTechnique) {
      const compositionDescription = this.getCompositionTechniqueDescription(params.compositionTechnique);
      technicalDetails.push(compositionDescription);
      cinematicTags.push(`composition:${params.compositionTechnique}`);
    }

    if (params.aspectRatio) {
      const aspectDescription = this.getAspectRatioDescription(params.aspectRatio);
      technicalDetails.push(aspectDescription);
      cinematicTags.push(`aspect-ratio:${params.aspectRatio}`);
    }
  }

  /**
   * Add technical specifications
   */
  private addTechnicalSpecs(
    params: Partial<CinematicParameters>,
    technicalDetails: string[],
    cinematicTags: string[]
  ): void {
    if (params.eraEmulation) {
      const eraDescription = this.getEraEmulationDescription(params.eraEmulation);
      technicalDetails.push(eraDescription);
      cinematicTags.push(`era-emulation:${params.eraEmulation}`);
    }
  }

  /**
   * Add style references
   */
  private addStyleReferences(
    params: Partial<CinematicParameters>,
    styleReferences: string[],
    cinematicTags: string[]
  ): void {
    if (params.directorStyle) {
      const directorDescription = this.getDirectorStyleDescription(params.directorStyle);
      styleReferences.push(directorDescription);
      cinematicTags.push(`director-style:${params.directorStyle}`);
    }
  }

  /**
   * Add environmental details
   */
  private addEnvironmentalDetails(
    params: Partial<CinematicParameters>,
    technicalDetails: string[],
    cinematicTags: string[]
  ): void {
    if (params.timeSetting) {
      const timeDescription = this.getTimeSettingDescription(params.timeSetting);
      technicalDetails.push(timeDescription);
      cinematicTags.push(`time-setting:${params.timeSetting}`);
    }

    if (params.weatherCondition) {
      const weatherDescription = this.getWeatherConditionDescription(params.weatherCondition);
      technicalDetails.push(weatherDescription);
      cinematicTags.push(`weather:${params.weatherCondition}`);
    }

    if (params.locationType) {
      const locationDescription = this.getLocationTypeDescription(params.locationType);
      technicalDetails.push(locationDescription);
      cinematicTags.push(`location:${params.locationType}`);
    }
  }

  /**
   * Add mood details
   */
  private addMoodDetails(
    params: Partial<CinematicParameters>,
    technicalDetails: string[],
    cinematicTags: string[]
  ): void {
    if (params.sceneMood) {
      const moodDescription = this.getSceneMoodDescription(params.sceneMood);
      technicalDetails.push(moodDescription);
      cinematicTags.push(`scene-mood:${params.sceneMood}`);
    }

    if (params.colorPalette) {
      const colorDescription = this.getColorPaletteDescription(params.colorPalette);
      technicalDetails.push(colorDescription);
      cinematicTags.push(`color-palette:${params.colorPalette}`);
    }

    if (params.foregroundElements && params.foregroundElements.length > 0) {
      const foregroundDescriptions = params.foregroundElements.map(element => 
        this.getForegroundElementDescription(element)
      );
      technicalDetails.push(...foregroundDescriptions);
      cinematicTags.push(`foreground-elements:${params.foregroundElements.join(',')}`);
    }

    if (params.subjectCount) {
      const subjectDescription = this.getSubjectCountDescription(params.subjectCount);
      technicalDetails.push(subjectDescription);
      cinematicTags.push(`subject-count:${params.subjectCount}`);
    }

    if (params.eyeContact) {
      const eyeDescription = this.getEyeContactDescription(params.eyeContact);
      technicalDetails.push(eyeDescription);
      cinematicTags.push(`eye-contact:${params.eyeContact}`);
    }
  }

  /**
   * Assemble the final prompt
   */
  private assemblePrompt(
    basePrompt: string,
    technicalDetails: string[],
    styleReferences: string[],
    enhancementType: string,
    maxLength: number
  ): string {
    const parts: string[] = [];

    // Start with base prompt
    parts.push(basePrompt);

    // Add enhancement type context
    if (enhancementType) {
      parts.push(this.getEnhancementTypeContext(enhancementType));
    }

    // Add technical details
    if (technicalDetails.length > 0) {
      parts.push(technicalDetails.join(', '));
    }

    // Add style references
    if (styleReferences.length > 0) {
      parts.push(`in the style of ${styleReferences.join(', ')}`);
    }

    // Join and truncate if necessary
    let fullPrompt = parts.join('. ');
    
    if (fullPrompt.length > maxLength) {
      fullPrompt = this.truncatePrompt(fullPrompt, maxLength);
    }

    return fullPrompt.trim();
  }

  /**
   * Truncate prompt while preserving important elements
   */
  private truncatePrompt(prompt: string, maxLength: number): string {
    if (prompt.length <= maxLength) return prompt;

    // Try to preserve the base prompt and first few technical details
    const sentences = prompt.split('. ');
    const truncated: string[] = [];
    let currentLength = 0;

    for (const sentence of sentences) {
      if (currentLength + sentence.length + 2 <= maxLength) {
        truncated.push(sentence);
        currentLength += sentence.length + 2;
      } else {
        break;
      }
    }

    return truncated.join('. ') + (truncated.length < sentences.length ? '...' : '');
  }

  /**
   * Estimate token count for the prompt
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Description getters for each parameter type
  private getCameraAngleDescription(angle: CameraAngle): string {
    const descriptions: Record<CameraAngle, string> = {
      'high-angle': 'high-angle shot looking down',
      'low-angle': 'low-angle shot looking up',
      'eye-level': 'eye-level shot',
      'worms-eye-view': 'worm\'s-eye view from ground level',
      'birds-eye-view': 'bird\'s-eye view from above',
      'dutch-angle': 'dutch angle tilted camera',
      'over-the-shoulder': 'over-the-shoulder shot',
      'point-of-view': 'point-of-view shot',
      'canted-angle': 'canted angle composition'
    };
    return descriptions[angle];
  }

  private getLensTypeDescription(lens: LensType): string {
    const descriptions: Record<LensType, string> = {
      'wide-angle-24mm': '24mm wide-angle lens',
      'wide-angle-35mm': '35mm wide-angle lens',
      'normal-50mm': '50mm normal lens',
      'portrait-85mm': '85mm portrait lens',
      'telephoto-135mm': '135mm telephoto lens',
      'telephoto-200mm': '200mm telephoto lens',
      'macro-lens': 'macro lens',
      'fisheye': 'fisheye lens',
      'anamorphic': 'anamorphic lens',
      'tilt-shift': 'tilt-shift lens'
    };
    return descriptions[lens];
  }

  private getShotSizeDescription(shot: ShotSize): string {
    const descriptions: Record<ShotSize, string> = {
      'extreme-close-up': 'extreme close-up',
      'close-up': 'close-up shot',
      'medium-close-up': 'medium close-up',
      'medium-shot': 'medium shot',
      'medium-long-shot': 'medium long shot',
      'wide-shot': 'wide shot',
      'extreme-wide-shot': 'extreme wide shot',
      'establishing-shot': 'establishing shot'
    };
    return descriptions[shot];
  }

  private getDepthOfFieldDescription(dof: DepthOfField): string {
    const descriptions: Record<DepthOfField, string> = {
      'shallow-focus': 'shallow depth of field',
      'deep-focus': 'deep depth of field',
      'rack-focus': 'rack focus transition',
      'tilt-shift-effect': 'tilt-shift effect',
      'bokeh-heavy': 'heavy bokeh background',
      'hyperfocal': 'hyperfocal distance'
    };
    return descriptions[dof];
  }

  private getCompositionTechniqueDescription(technique: CompositionTechnique): string {
    const descriptions: Record<CompositionTechnique, string> = {
      'rule-of-thirds': 'rule of thirds composition',
      'central-framing': 'central framing',
      'symmetry': 'symmetrical composition',
      'leading-lines': 'leading lines composition',
      'negative-space': 'negative space composition',
      'golden-ratio': 'golden ratio composition',
      'diagonal-composition': 'diagonal composition',
      'frame-within-frame': 'frame within frame',
      'triangular-composition': 'triangular composition',
      'radial-composition': 'radial composition'
    };
    return descriptions[technique];
  }

  private getLightingStyleDescription(lighting: LightingStyle): string {
    const descriptions: Record<LightingStyle, string> = {
      'natural-light': 'natural lighting',
      'high-key': 'high-key lighting',
      'low-key': 'low-key lighting',
      'chiaroscuro': 'chiaroscuro lighting',
      'backlit-silhouette': 'backlit silhouette',
      'rim-lighting': 'rim lighting',
      'side-lighting': 'side lighting',
      'top-lighting': 'top lighting',
      'bottom-lighting': 'bottom lighting',
      'colored-gels': 'colored gel lighting',
      'practical-lighting': 'practical lighting',
      'hard-light': 'hard light',
      'soft-light': 'soft light',
      'mixed-lighting': 'mixed lighting',
      'volumetric-lighting': 'volumetric lighting'
    };
    return descriptions[lighting];
  }

  private getColorPaletteDescription(palette: ColorPalette): string {
    const descriptions: Record<ColorPalette, string> = {
      'warm-golden': 'warm golden color palette',
      'cool-blue': 'cool blue color palette',
      'monochrome': 'monochrome',
      'sepia': 'sepia toned',
      'desaturated': 'desaturated colors',
      'high-saturation': 'high saturation',
      'pastel': 'pastel colors',
      'neon': 'neon colors',
      'earth-tones': 'earth tones',
      'jewel-tones': 'jewel tones',
      'film-stock-emulation': 'film stock emulation',
      'teal-and-orange': 'teal and orange grading',
      'split-toning': 'split toning',
      'cross-processing': 'cross processing',
      'vintage-wash': 'vintage wash'
    };
    return descriptions[palette];
  }

  private getDirectorStyleDescription(style: DirectorStyle): string {
    const descriptions: Record<DirectorStyle, string> = {
      'wes-anderson': 'Wes Anderson',
      'roger-deakins': 'Roger Deakins',
      'christopher-doyle': 'Christopher Doyle',
      'david-fincher': 'David Fincher',
      'sofia-coppola': 'Sofia Coppola',
      'stanley-kubrick': 'Stanley Kubrick',
      'terrence-malick': 'Terrence Malick',
      'paul-thomas-anderson': 'Paul Thomas Anderson',
      'denis-villeneuve': 'Denis Villeneuve',
      'emmanuel-lubezki': 'Emmanuel Lubezki',
      'janusz-kaminski': 'Janusz Kaminski',
      'robert-richardson': 'Robert Richardson',
      'darius-khondji': 'Darius Khondji',
      'bruno-delbonnel': 'Bruno Delbonnel',
      'seamus-mcgarvey': 'Seamus McGarvey',
      // Custom directors from database
      'christopher-nolan': 'Christopher Nolan',
      'greta-gerwig': 'Greta Gerwig',
      'jordan-peele': 'Jordan Peele'
    };
    return descriptions[style] || style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getEraEmulationDescription(era: EraEmulation): string {
    const descriptions: Record<EraEmulation, string> = {
      'vintage-16mm-grain': 'vintage 16mm film grain',
      'super-8': 'Super 8 film aesthetic',
      '1970s-bleach-bypass': '1970s bleach bypass',
      '1980s-vhs': '1980s VHS aesthetic',
      '1990s-film': '1990s film look',
      'kodak-portra-400': 'Kodak Portra 400',
      'fuji-velvia-50': 'Fuji Velvia 50',
      'kodak-tri-x': 'Kodak Tri-X',
      'ilford-hp5': 'Ilford HP5',
      'polaroid-instant': 'Polaroid instant',
      'lomography': 'Lomography style',
      'daguerreotype': 'daguerreotype',
      'tintype': 'tintype',
      'cyanotype': 'cyanotype',
      'sepia-toned': 'sepia toned'
    };
    return descriptions[era];
  }

  private getSceneMoodDescription(mood: SceneMood): string {
    const descriptions: Record<SceneMood, string> = {
      'gritty': 'gritty atmosphere',
      'dreamlike': 'dreamlike quality',
      'futuristic': 'futuristic aesthetic',
      'romantic': 'romantic mood',
      'action-packed': 'dynamic action',
      'film-noir': 'film noir style',
      'melancholic': 'melancholic tone',
      'mysterious': 'mysterious atmosphere',
      'nostalgic': 'nostalgic feeling',
      'dramatic': 'dramatic tension',
      'peaceful': 'peaceful ambiance',
      'tense': 'tense atmosphere',
      'epic': 'epic scale',
      'intimate': 'intimate setting',
      'surreal': 'surreal elements',
      'minimalist': 'minimalist approach',
      'baroque': 'baroque style',
      'industrial': 'industrial aesthetic',
      'natural': 'natural beauty',
      'ethereal': 'ethereal quality',
      // Custom moods from Cinematic Library
      'cyberpunk-neon': 'cyberpunk neon atmosphere',
      'cozy-autumn': 'cozy autumn mood',
      'melancholic-rain': 'melancholic rainy atmosphere',
      'ethereal-dream': 'ethereal dreamlike quality',
      'industrial-grit': 'industrial gritty aesthetic'
    };
    return descriptions[mood] || mood.replace(/-/g, ' ') + ' atmosphere';
  }

  private getCameraMovementDescription(movement: CameraMovement): string {
    const descriptions: Record<CameraMovement, string> = {
      'static': 'static camera',
      'pan-left': 'pan left',
      'pan-right': 'pan right',
      'tilt-up': 'tilt up',
      'tilt-down': 'tilt down',
      'handheld': 'handheld camera',
      'tracking-forward': 'tracking forward',
      'tracking-backward': 'tracking backward',
      'tracking-left': 'tracking left',
      'tracking-right': 'tracking right',
      'dolly-in': 'dolly in',
      'dolly-out': 'dolly out',
      'crane-up': 'crane up',
      'crane-down': 'crane down',
      'orbit-clockwise': 'orbit clockwise',
      'orbit-counterclockwise': 'orbit counterclockwise',
      'zoom-in': 'zoom in',
      'zoom-out': 'zoom out',
      'push-pull': 'push-pull zoom',
      'whip-pan': 'whip pan',
      'snap-zoom': 'snap zoom',
      'floating': 'floating camera',
      'shaky': 'shaky camera',
      'smooth': 'smooth camera movement',
      'jerky': 'jerky movement',
      'spiral': 'spiral movement',
      'figure-eight': 'figure-eight movement',
      'pendulum': 'pendulum movement',
      'free-fall': 'free-fall movement',
      'ascending': 'ascending movement'
    };
    return descriptions[movement];
  }

  private getAspectRatioDescription(ratio: AspectRatio): string {
    const descriptions: Record<AspectRatio, string> = {
      '1:1': 'square format',
      '4:3': '4:3 aspect ratio',
      '16:9': '16:9 widescreen',
      '21:9': '21:9 ultra-wide',
      '2.39:1': '2.39:1 cinemascope',
      '2.35:1': '2.35:1 anamorphic',
      '1.85:1': '1.85:1 academy flat',
      '9:16': '9:16 vertical',
      '3:2': '3:2 photography',
      '5:4': '5:4 large format',
      '6:7': '6:7 medium format',
      'golden-ratio': 'golden ratio',
      'cinema-scope': 'cinema scope',
      'vista-vision': 'vista vision',
      'imax': 'IMAX format',
      'full-frame': 'full frame',
      'aps-c': 'APS-C format',
      'micro-four-thirds': 'micro four thirds',
      'medium-format': 'medium format',
      'large-format': 'large format'
    };
    return descriptions[ratio];
  }

  private getTimeSettingDescription(time: TimeSetting): string {
    const descriptions: Record<TimeSetting, string> = {
      'dawn': 'dawn light',
      'morning': 'morning light',
      'midday': 'midday sun',
      'afternoon': 'afternoon light',
      'golden-hour': 'golden hour',
      'sunset': 'sunset light',
      'dusk': 'dusk atmosphere',
      'twilight': 'twilight',
      'night': 'night time',
      'midnight': 'midnight',
      'blue-hour': 'blue hour',
      'magic-hour': 'magic hour',
      'high-noon': 'high noon',
      'late-afternoon': 'late afternoon',
      'early-evening': 'early evening',
      'late-night': 'late night',
      'pre-dawn': 'pre-dawn',
      'post-sunset': 'post-sunset',
      'overcast-day': 'overcast day',
      'stormy-weather': 'stormy weather'
    };
    return descriptions[time];
  }

  private getWeatherConditionDescription(weather: WeatherCondition): string {
    const descriptions: Record<WeatherCondition, string> = {
      'sunny': 'sunny weather',
      'partly-cloudy': 'partly cloudy',
      'overcast': 'overcast sky',
      'foggy': 'foggy conditions',
      'rainy': 'rainy weather',
      'stormy': 'stormy weather',
      'snowy': 'snowy conditions',
      'windy': 'windy weather',
      'humid': 'humid atmosphere',
      'dry': 'dry conditions',
      'hazy': 'hazy atmosphere',
      'crisp': 'crisp conditions',
      'misty': 'misty atmosphere',
      'drizzly': 'drizzly weather',
      'torrential': 'torrential rain',
      'blizzard': 'blizzard conditions',
      'sandstorm': 'sandstorm',
      'heat-wave': 'heat wave',
      'freezing': 'freezing conditions',
      'tropical': 'tropical weather'
    };
    return descriptions[weather];
  }

  private getLocationTypeDescription(location: LocationType): string {
    const descriptions: Record<LocationType, string> = {
      'urban-street': 'urban street',
      'rural-field': 'rural field',
      'forest': 'forest setting',
      'desert': 'desert landscape',
      'mountain': 'mountain terrain',
      'beach': 'beach setting',
      'lake': 'lake setting',
      'ocean': 'ocean setting',
      'park': 'park setting',
      'garden': 'garden setting',
      'rooftop': 'rooftop setting',
      'alleyway': 'alleyway',
      'highway': 'highway',
      'bridge': 'bridge setting',
      'tunnel': 'tunnel setting',
      'courtyard': 'courtyard',
      'plaza': 'plaza setting',
      'marketplace': 'marketplace',
      'playground': 'playground',
      'cemetery': 'cemetery',
      'ruins': 'ruins',
      'construction-site': 'construction site',
      'industrial-area': 'industrial area',
      'residential-neighborhood': 'residential neighborhood',
      'downtown': 'downtown',
      'suburb': 'suburban setting',
      'waterfront': 'waterfront',
      'skyline': 'city skyline',
      'countryside': 'countryside',
      'wilderness': 'wilderness'
    };
    return descriptions[location];
  }

  private getForegroundElementDescription(element: ForegroundElement): string {
    const descriptions: Record<ForegroundElement, string> = {
      'raindrops-on-window': 'raindrops on window',
      'tree-branches': 'tree branches',
      'lens-flare': 'lens flare',
      'smoke': 'smoke',
      'dust-particles': 'dust particles',
      'snowflakes': 'snowflakes',
      'leaves': 'leaves',
      'insects': 'insects',
      'birds': 'birds',
      'shadows': 'shadows',
      'reflections': 'reflections',
      'steam': 'steam',
      'fog': 'fog',
      'mist': 'mist',
      'haze': 'haze',
      'glare': 'glare',
      'bloom': 'bloom',
      'vignette': 'vignette',
      'grain': 'grain',
      'scratches': 'scratches',
      'water-drops': 'water drops',
      'sparkles': 'sparkles',
      'bokeh-lights': 'bokeh lights',
      'light-streaks': 'light streaks',
      'particles': 'particles',
      'texture-overlay': 'texture overlay',
      'color-fringe': 'color fringe',
      'lens-distortion': 'lens distortion',
      'focus-breathing': 'focus breathing',
      'motion-blur': 'motion blur',
      'flowers': 'flowers in foreground',
      'branches': 'branches in foreground',
      'fence': 'fence in foreground',
      'window': 'window in foreground',
      'door': 'door in foreground',
      'vehicle': 'vehicle in foreground',
      'person': 'person in foreground',
      'animal': 'animal in foreground',
      'object': 'object in foreground',
      'texture': 'textured foreground',
      'pattern': 'patterned foreground',
      'shadow': 'shadow in foreground',
      'reflection': 'reflection in foreground',
      'silhouette': 'silhouette in foreground',
      'blur': 'blurred foreground',
      'bokeh': 'bokeh foreground',
      'none': 'clean foreground'
    };
    return descriptions[element];
  }

  private getSubjectCountDescription(count: SubjectCount): string {
    const descriptions: Record<SubjectCount, string> = {
      'solo': 'single subject',
      'pair': 'pair of subjects',
      'small-group': 'small group',
      'medium-group': 'medium group',
      'large-group': 'large group',
      'crowd': 'crowd',
      'empty': 'empty scene',
      'multiple': 'multiple subjects',
      'duo': 'duo',
      'ensemble': 'ensemble',
      'single': 'single subject',
      'couple': 'couple',
      'group-small': 'small group',
      'group-medium': 'medium group',
      'group-large': 'large group',
      'none': 'no subjects'
    };
    return descriptions[count];
  }

  private getEyeContactDescription(contact: EyeContact): string {
    const descriptions: Record<EyeContact, string> = {
      'direct-gaze': 'direct eye contact',
      'profile-view': 'profile view',
      'looking-away': 'looking away',
      'looking-down': 'looking down',
      'looking-up': 'looking up',
      'looking-left': 'looking left',
      'looking-right': 'looking right',
      'eyes-closed': 'eyes closed',
      'partial-face': 'partial face visible',
      'back-of-head': 'back of head',
      'direct': 'direct eye contact',
      'closed-eyes': 'closed eyes',
      'profile': 'profile view',
      'back-view': 'back view',
      'none': 'no eye contact'
    };
    return descriptions[contact];
  }

  private getEnhancementTypeContext(enhancementType: string): string {
    const contexts: Record<string, string> = {
      'lighting': 'enhance the lighting to create',
      'style': 'apply artistic style',
      'background': 'enhance the background with',
      'mood': 'enhance the mood to be',
      'color': 'enhance the color palette',
      'composition': 'enhance the composition',
      'cinematic': 'create cinematic quality',
      'portrait': 'enhance portrait qualities',
      'landscape': 'enhance landscape elements',
      'street': 'enhance street photography style'
    };
    return contexts[enhancementType] || '';
  }

  /**
   * Generate a prompt template based on common cinematic combinations
   */
  generatePromptTemplate(
    category: 'portrait' | 'landscape' | 'street' | 'cinematic' | 'artistic' | 'commercial',
    mood: SceneMood,
    style?: DirectorStyle
  ): Partial<CinematicParameters> {
    const templates = {
      portrait: {
        cameraAngle: 'eye-level' as CameraAngle,
        lensType: 'portrait-85mm' as LensType,
        shotSize: 'close-up' as ShotSize,
        depthOfField: 'shallow-focus' as DepthOfField,
        lightingStyle: 'soft-light' as LightingStyle,
        compositionTechnique: 'rule-of-thirds' as CompositionTechnique
      },
      landscape: {
        cameraAngle: 'eye-level' as CameraAngle,
        lensType: 'wide-angle-24mm' as LensType,
        shotSize: 'wide-shot' as ShotSize,
        depthOfField: 'deep-focus' as DepthOfField,
        lightingStyle: 'natural-light' as LightingStyle,
        compositionTechnique: 'rule-of-thirds' as CompositionTechnique
      },
      street: {
        cameraAngle: 'eye-level' as CameraAngle,
        lensType: 'normal-50mm' as LensType,
        shotSize: 'medium-shot' as ShotSize,
        depthOfField: 'deep-focus' as DepthOfField,
        lightingStyle: 'natural-light' as LightingStyle,
        compositionTechnique: 'leading-lines' as CompositionTechnique
      },
      cinematic: {
        cameraAngle: 'low-angle' as CameraAngle,
        lensType: 'anamorphic' as LensType,
        shotSize: 'wide-shot' as ShotSize,
        depthOfField: 'shallow-focus' as DepthOfField,
        lightingStyle: 'chiaroscuro' as LightingStyle,
        compositionTechnique: 'symmetry' as CompositionTechnique,
        aspectRatio: '2.39:1' as AspectRatio
      },
      artistic: {
        cameraAngle: 'dutch-angle' as CameraAngle,
        lensType: 'fisheye' as LensType,
        shotSize: 'medium-shot' as ShotSize,
        depthOfField: 'tilt-shift-effect' as DepthOfField,
        lightingStyle: 'colored-gels' as LightingStyle,
        compositionTechnique: 'diagonal-composition' as CompositionTechnique
      },
      commercial: {
        cameraAngle: 'eye-level' as CameraAngle,
        lensType: 'normal-50mm' as LensType,
        shotSize: 'medium-shot' as ShotSize,
        depthOfField: 'shallow-focus' as DepthOfField,
        lightingStyle: 'high-key' as LightingStyle,
        compositionTechnique: 'central-framing' as CompositionTechnique
      }
    };

    const baseTemplate = templates[category];
    const result: Partial<CinematicParameters> = { ...baseTemplate };

    // Add mood-specific parameters
    result.sceneMood = mood;

    // Add style-specific parameters if provided
    if (style) {
      result.directorStyle = style;
      
      // Override some parameters based on director style
      if (style === 'wes-anderson') {
        result.compositionTechnique = 'symmetry';
        result.colorPalette = 'pastel';
        result.cameraAngle = 'eye-level';
      } else if (style === 'david-fincher') {
        result.lightingStyle = 'low-key';
        result.colorPalette = 'desaturated';
        result.cameraMovement = 'smooth';
      } else if (style === 'christopher-doyle') {
        result.lightingStyle = 'colored-gels';
        result.colorPalette = 'neon';
        result.cameraMovement = 'handheld';
      }
    }

    return result;
  }

  /**
   * Add subject-aware cinematic adjustments based on the subject type
   */
  private addSubjectAwareAdjustments(
    subject: string,
    cinematicParameters: Partial<CinematicParameters>,
    technicalDetails: string[],
    cinematicTags: string[]
  ): void {
    const subjectLower = subject.toLowerCase();
    
    // Portrait/Person adjustments
    if (this.isPersonSubject(subjectLower)) {
      if (!cinematicParameters.cameraAngle) {
        technicalDetails.push('portrait framing');
        cinematicTags.push('subject-type:person');
      }
      if (!cinematicParameters.lightingStyle) {
        technicalDetails.push('flattering portrait lighting');
        cinematicTags.push('lighting:portrait');
      }
    }
    
    // Landscape/Nature adjustments
    else if (this.isLandscapeSubject(subjectLower)) {
      if (!cinematicParameters.cameraAngle) {
        technicalDetails.push('wide landscape framing');
        cinematicTags.push('subject-type:landscape');
      }
      if (!cinematicParameters.lightingStyle) {
        technicalDetails.push('natural ambient lighting');
        cinematicTags.push('lighting:natural');
      }
    }
    
    // Architecture/Building adjustments
    else if (this.isArchitectureSubject(subjectLower)) {
      if (!cinematicParameters.cameraAngle) {
        technicalDetails.push('architectural framing');
        cinematicTags.push('subject-type:architecture');
      }
      if (!cinematicParameters.lightingStyle) {
        technicalDetails.push('dramatic architectural lighting');
        cinematicTags.push('lighting:architectural');
      }
    }
    
    // Product/Object adjustments
    else if (this.isProductSubject(subjectLower)) {
      if (!cinematicParameters.cameraAngle) {
        technicalDetails.push('product photography framing');
        cinematicTags.push('subject-type:product');
      }
      if (!cinematicParameters.lightingStyle) {
        technicalDetails.push('clean product lighting');
        cinematicTags.push('lighting:product');
      }
    }
    
    // Abstract/Artistic adjustments
    else if (this.isAbstractSubject(subjectLower)) {
      if (!cinematicParameters.lightingStyle) {
        technicalDetails.push('artistic lighting');
        cinematicTags.push('lighting:artistic');
      }
    }
  }

  /**
   * Check if subject is a person/portrait
   */
  private isPersonSubject(subject: string): boolean {
    const personKeywords = ['person', 'man', 'woman', 'child', 'baby', 'portrait', 'face', 'head', 'character', 'people', 'human'];
    return personKeywords.some(keyword => subject.includes(keyword));
  }

  /**
   * Check if subject is a landscape/nature scene
   */
  private isLandscapeSubject(subject: string): boolean {
    const landscapeKeywords = ['landscape', 'mountain', 'forest', 'ocean', 'sea', 'lake', 'river', 'valley', 'hill', 'field', 'meadow', 'desert', 'beach', 'sunset', 'sunrise', 'sky', 'cloud', 'nature'];
    return landscapeKeywords.some(keyword => subject.includes(keyword));
  }

  /**
   * Check if subject is architecture/buildings
   */
  private isArchitectureSubject(subject: string): boolean {
    const architectureKeywords = ['building', 'house', 'castle', 'church', 'tower', 'bridge', 'monument', 'architecture', 'structure', 'facade', 'interior', 'room'];
    return architectureKeywords.some(keyword => subject.includes(keyword));
  }

  /**
   * Check if subject is a product/object
   */
  private isProductSubject(subject: string): boolean {
    const productKeywords = ['product', 'object', 'item', 'thing', 'tool', 'device', 'car', 'vehicle', 'furniture', 'chair', 'table', 'book', 'phone', 'laptop'];
    return productKeywords.some(keyword => subject.includes(keyword));
  }

  /**
   * Check if subject is abstract/artistic
   */
  private isAbstractSubject(subject: string): boolean {
    const abstractKeywords = ['abstract', 'art', 'painting', 'drawing', 'design', 'pattern', 'texture', 'color', 'shape', 'form', 'concept', 'idea'];
    return abstractKeywords.some(keyword => subject.includes(keyword));
  }
}

export default CinematicPromptBuilder;
