/**
 * Cinematic Mention Builder Utility
 * 
 * Builds mentionable entities from CinematicParameters and other sources
 * for the universal mention system.
 */

import type { CinematicParameters } from '@preset/types';
import type { MentionableEntity, MentionType } from './mention-types';
import { createMentionableEntity } from './mention-types';

/**
 * Build mentionable entities from CinematicParameters
 */
export function buildCinematicMentionEntities(
  cinematicParams: CinematicParameters
): MentionableEntity[] {
  const entities: MentionableEntity[] = [];

  // Camera angle
  if (cinematicParams.cameraAngle) {
    entities.push(createMentionableEntity(
      `camera-angle-${cinematicParams.cameraAngle}`,
      cinematicParams.cameraAngle.replace(/-/g, ' '),
      'camera',
      cinematicParams.cameraAngle,
      {
        category: 'Camera',
        subcategory: 'Angle',
        description: `Camera angle: ${cinematicParams.cameraAngle}`,
        synonyms: [cinematicParams.cameraAngle.replace(/-/g, ' ')]
      }
    ));
  }

  // Lens type
  if (cinematicParams.lensType) {
    entities.push(createMentionableEntity(
      `lens-type-${cinematicParams.lensType}`,
      cinematicParams.lensType.replace(/-/g, ' '),
      'camera',
      cinematicParams.lensType,
      {
        category: 'Camera',
        subcategory: 'Lens',
        description: `Lens type: ${cinematicParams.lensType}`,
        synonyms: [cinematicParams.lensType.replace(/-/g, ' ')]
      }
    ));
  }

  // Shot size
  if (cinematicParams.shotSize) {
    entities.push(createMentionableEntity(
      `shot-size-${cinematicParams.shotSize}`,
      cinematicParams.shotSize.replace(/-/g, ' '),
      'shot-size',
      cinematicParams.shotSize,
      {
        category: 'Camera',
        subcategory: 'Shot Size',
        description: `Shot size: ${cinematicParams.shotSize}`,
        synonyms: [cinematicParams.shotSize.replace(/-/g, ' ')]
      }
    ));
  }

  // Depth of field
  if (cinematicParams.depthOfField) {
    entities.push(createMentionableEntity(
      `depth-of-field-${cinematicParams.depthOfField}`,
      cinematicParams.depthOfField.replace(/-/g, ' '),
      'depth-of-field',
      cinematicParams.depthOfField,
      {
        category: 'Camera',
        subcategory: 'Depth of Field',
        description: `Depth of field: ${cinematicParams.depthOfField}`,
        synonyms: [cinematicParams.depthOfField.replace(/-/g, ' ')]
      }
    ));
  }

  // Composition technique
  if (cinematicParams.compositionTechnique) {
    entities.push(createMentionableEntity(
      `composition-${cinematicParams.compositionTechnique}`,
      cinematicParams.compositionTechnique.replace(/-/g, ' '),
      'composition',
      cinematicParams.compositionTechnique,
      {
        category: 'Composition',
        subcategory: 'Technique',
        description: `Composition: ${cinematicParams.compositionTechnique}`,
        synonyms: [cinematicParams.compositionTechnique.replace(/-/g, ' ')]
      }
    ));
  }

  // Lighting style
  if (cinematicParams.lightingStyle) {
    entities.push(createMentionableEntity(
      `lighting-${cinematicParams.lightingStyle}`,
      cinematicParams.lightingStyle.replace(/-/g, ' '),
      'lighting',
      cinematicParams.lightingStyle,
      {
        category: 'Lighting',
        subcategory: 'Style',
        description: `Lighting: ${cinematicParams.lightingStyle}`,
        synonyms: [cinematicParams.lightingStyle.replace(/-/g, ' ')]
      }
    ));
  }

  // Color palette
  if (cinematicParams.colorPalette) {
    entities.push(createMentionableEntity(
      `color-${cinematicParams.colorPalette}`,
      cinematicParams.colorPalette.replace(/-/g, ' '),
      'color',
      cinematicParams.colorPalette,
      {
        category: 'Color',
        subcategory: 'Palette',
        description: `Color palette: ${cinematicParams.colorPalette}`,
        synonyms: [cinematicParams.colorPalette.replace(/-/g, ' ')]
      }
    ));
  }

  // Director style
  if (cinematicParams.directorStyle) {
    entities.push(createMentionableEntity(
      `style-${cinematicParams.directorStyle}`,
      cinematicParams.directorStyle.replace(/-/g, ' '),
      'style',
      cinematicParams.directorStyle,
      {
        category: 'Style',
        subcategory: 'Director',
        description: `Director style: ${cinematicParams.directorStyle}`,
        synonyms: [cinematicParams.directorStyle.replace(/-/g, ' ')]
      }
    ));
  }

  // Era emulation
  if (cinematicParams.eraEmulation) {
    entities.push(createMentionableEntity(
      `era-${cinematicParams.eraEmulation}`,
      cinematicParams.eraEmulation.replace(/-/g, ' '),
      'style',
      cinematicParams.eraEmulation,
      {
        category: 'Style',
        subcategory: 'Era',
        description: `Era emulation: ${cinematicParams.eraEmulation}`,
        synonyms: [cinematicParams.eraEmulation.replace(/-/g, ' ')]
      }
    ));
  }

  // Scene mood
  if (cinematicParams.sceneMood) {
    entities.push(createMentionableEntity(
      `mood-${cinematicParams.sceneMood}`,
      cinematicParams.sceneMood.replace(/-/g, ' '),
      'mood',
      cinematicParams.sceneMood,
      {
        category: 'Mood',
        subcategory: 'Scene',
        description: `Scene mood: ${cinematicParams.sceneMood}`,
        synonyms: [cinematicParams.sceneMood.replace(/-/g, ' ')]
      }
    ));
  }

  // Camera movement
  if (cinematicParams.cameraMovement) {
    entities.push(createMentionableEntity(
      `movement-${cinematicParams.cameraMovement}`,
      cinematicParams.cameraMovement.replace(/-/g, ' '),
      'camera',
      cinematicParams.cameraMovement,
      {
        category: 'Camera',
        subcategory: 'Movement',
        description: `Camera movement: ${cinematicParams.cameraMovement}`,
        synonyms: [cinematicParams.cameraMovement.replace(/-/g, ' ')]
      }
    ));
  }

  // Aspect ratio
  if (cinematicParams.aspectRatio) {
    entities.push(createMentionableEntity(
      `aspect-${cinematicParams.aspectRatio}`,
      cinematicParams.aspectRatio,
      'dimension',
      cinematicParams.aspectRatio,
      {
        category: 'Dimensions',
        subcategory: 'Aspect Ratio',
        description: `Aspect ratio: ${cinematicParams.aspectRatio}`,
        synonyms: [cinematicParams.aspectRatio]
      }
    ));
  }

  // Time setting
  if (cinematicParams.timeSetting) {
    entities.push(createMentionableEntity(
      `time-${cinematicParams.timeSetting}`,
      cinematicParams.timeSetting.replace(/-/g, ' '),
      'time',
      cinematicParams.timeSetting,
      {
        category: 'Time',
        subcategory: 'Setting',
        description: `Time: ${cinematicParams.timeSetting}`,
        synonyms: [cinematicParams.timeSetting.replace(/-/g, ' ')]
      }
    ));
  }

  // Weather condition
  if (cinematicParams.weatherCondition) {
    entities.push(createMentionableEntity(
      `weather-${cinematicParams.weatherCondition}`,
      cinematicParams.weatherCondition.replace(/-/g, ' '),
      'weather',
      cinematicParams.weatherCondition,
      {
        category: 'Weather',
        subcategory: 'Condition',
        description: `Weather: ${cinematicParams.weatherCondition}`,
        synonyms: [cinematicParams.weatherCondition.replace(/-/g, ' ')]
      }
    ));
  }

  // Location type
  if (cinematicParams.locationType) {
    entities.push(createMentionableEntity(
      `location-${cinematicParams.locationType}`,
      cinematicParams.locationType.replace(/-/g, ' '),
      'location',
      cinematicParams.locationType,
      {
        category: 'Location',
        subcategory: 'Type',
        description: `Location: ${cinematicParams.locationType}`,
        synonyms: [cinematicParams.locationType.replace(/-/g, ' ')]
      }
    ));
  }

  // Foreground elements
  if (cinematicParams.foregroundElements && cinematicParams.foregroundElements.length > 0) {
    cinematicParams.foregroundElements.forEach((element, index) => {
      entities.push(createMentionableEntity(
        `foreground-${element}-${index}`,
        element.replace(/-/g, ' '),
        'subject',
        element,
        {
          category: 'Subject',
          subcategory: 'Foreground',
          description: `Foreground element: ${element.replace(/-/g, ' ')}`,
          synonyms: [element.replace(/-/g, ' ')]
        }
      ));
    });
  }

  // Subject count
  if (cinematicParams.subjectCount) {
    entities.push(createMentionableEntity(
      `subjects-${cinematicParams.subjectCount}`,
      cinematicParams.subjectCount.replace(/-/g, ' '),
      'subject',
      cinematicParams.subjectCount,
      {
        category: 'Subject',
        subcategory: 'Count',
        description: `Subject count: ${cinematicParams.subjectCount}`,
        synonyms: [cinematicParams.subjectCount.replace(/-/g, ' ')]
      }
    ));
  }

  // Eye contact
  if (cinematicParams.eyeContact) {
    entities.push(createMentionableEntity(
      `eye-contact-${cinematicParams.eyeContact}`,
      cinematicParams.eyeContact.replace(/-/g, ' '),
      'subject',
      cinematicParams.eyeContact,
      {
        category: 'Subject',
        subcategory: 'Eye Contact',
        description: `Eye contact: ${cinematicParams.eyeContact}`,
        synonyms: [cinematicParams.eyeContact.replace(/-/g, ' ')]
      }
    ));
  }

  return entities;
}

/**
 * Build mentionable entities from user's saved images
 */
export function buildImageMentionEntities(
  images: Array<{ id: string; url: string; name?: string; description?: string }>
): MentionableEntity[] {
  return images.map(image => 
    createMentionableEntity(
      `image-${image.id}`,
      image.name || `Image ${image.id}`,
      'source-image',
      image.id,
      {
        category: 'Image',
        subcategory: 'Source',
        description: image.description || 'User uploaded image',
        thumbnail: image.url
      }
    )
  );
}

/**
 * Build mentionable entities from user's saved presets
 */
export function buildPresetMentionEntities(
  presets: Array<{ id: string; name: string; description?: string; cinematicParams?: CinematicParameters }>
): MentionableEntity[] {
  return presets.map(preset => 
    createMentionableEntity(
      `preset-${preset.id}`,
      preset.name,
      'preset',
      preset.id,
      {
        category: 'Preset',
        subcategory: 'User',
        description: preset.description || 'User saved preset',
        relatedParams: preset.cinematicParams ? Object.keys(preset.cinematicParams) : []
      }
    )
  );
}

/**
 * Build context-specific mentionable entities
 */
export function buildContextualMentionEntities(
  context: {
    mode: 'text-to-image' | 'image-to-image' | 'video' | 'edit' | 'batch';
    selectedImages?: string[];
    currentPreset?: any;
    cinematicParams?: CinematicParameters;
  }
): MentionableEntity[] {
  const entities: MentionableEntity[] = [];

  // Add cinematic parameters if available
  if (context.cinematicParams) {
    entities.push(...buildCinematicMentionEntities(context.cinematicParams));
  }

  // Add current preset if available
  if (context.currentPreset) {
    entities.push(createMentionableEntity(
      `current-preset-${context.currentPreset.id || 'default'}`,
      context.currentPreset.name || 'Current Preset',
      'preset',
      context.currentPreset.id || 'current',
      {
        category: 'Preset',
        subcategory: 'Current',
        description: 'Currently selected preset',
        relatedParams: context.currentPreset.cinematicParams ? Object.keys(context.currentPreset.cinematicParams) : []
      }
    ));
  }

  // Add selected images if available
  if (context.selectedImages && context.selectedImages.length > 0) {
    context.selectedImages.forEach((imageId, index) => {
      entities.push(createMentionableEntity(
        `selected-image-${imageId}`,
        `Selected Image ${index + 1}`,
        'source-image',
        imageId,
        {
          category: 'Image',
          subcategory: 'Selected',
          description: `Currently selected image ${index + 1}`,
          confidence: 1.0
        }
      ));
    });
  }

  // Add mode-specific entities
  switch (context.mode) {
    case 'text-to-image':
      // Add common subject types
      entities.push(
        createMentionableEntity('subject-portrait', 'portrait', 'subject', 'portrait', {
          category: 'Subject',
          subcategory: 'Type',
          description: 'Portrait photography'
        }),
        createMentionableEntity('subject-landscape', 'landscape', 'subject', 'landscape', {
          category: 'Subject',
          subcategory: 'Type',
          description: 'Landscape photography'
        }),
        createMentionableEntity('subject-character', 'character', 'subject', 'character', {
          category: 'Subject',
          subcategory: 'Type',
          description: 'Character or person'
        })
      );
      break;

    case 'image-to-image':
      // Add edit types
      entities.push(
        createMentionableEntity('edit-upscale', 'upscale', 'edit-type', 'upscale', {
          category: 'Edit',
          subcategory: 'Enhancement',
          description: 'Upscale image resolution'
        }),
        createMentionableEntity('edit-enhance', 'enhance', 'edit-type', 'enhance', {
          category: 'Edit',
          subcategory: 'Enhancement',
          description: 'Enhance image quality'
        }),
        createMentionableEntity('edit-remove-background', 'remove background', 'edit-type', 'remove-background', {
          category: 'Edit',
          subcategory: 'Modification',
          description: 'Remove background from image'
        })
      );
      break;

    case 'video':
      // Add video-specific entities
      entities.push(
        createMentionableEntity('motion-smooth', 'smooth', 'cinematic-parameter', 'smooth', {
          category: 'Video',
          subcategory: 'Motion',
          description: 'Smooth camera movement'
        }),
        createMentionableEntity('motion-cinematic', 'cinematic', 'cinematic-parameter', 'cinematic', {
          category: 'Video',
          subcategory: 'Motion',
          description: 'Cinematic camera movement'
        })
      );
      break;

    case 'edit':
      // Add edit-specific entities
      entities.push(
        createMentionableEntity('edit-crop', 'crop', 'edit-type', 'crop', {
          category: 'Edit',
          subcategory: 'Modification',
          description: 'Crop image'
        }),
        createMentionableEntity('edit-resize', 'resize', 'edit-type', 'resize', {
          category: 'Edit',
          subcategory: 'Modification',
          description: 'Resize image'
        })
      );
      break;

    case 'batch':
      // Add batch-specific entities
      entities.push(
        createMentionableEntity('batch-variations', 'variations', 'subject', 'variations', {
          category: 'Batch',
          subcategory: 'Processing',
          description: 'Generate multiple variations'
        })
      );
      break;
  }

  return entities;
}

/**
 * Combine all mentionable entities for a given context
 */
export function buildAllMentionEntities(
  context: {
    mode: 'text-to-image' | 'image-to-image' | 'video' | 'edit' | 'batch';
    selectedImages?: string[];
    currentPreset?: any;
    cinematicParams?: CinematicParameters;
    userImages?: Array<{ id: string; url: string; name?: string; description?: string }>;
    userPresets?: Array<{ id: string; name: string; description?: string; cinematicParams?: CinematicParameters }>;
  }
): MentionableEntity[] {
  const entities: MentionableEntity[] = [];

  // Add contextual entities
  entities.push(...buildContextualMentionEntities(context));

  // Add user images
  if (context.userImages) {
    entities.push(...buildImageMentionEntities(context.userImages));
  }

  // Add user presets
  if (context.userPresets) {
    entities.push(...buildPresetMentionEntities(context.userPresets));
  }

  // Remove duplicates based on ID
  const uniqueEntities = entities.filter((entity, index, self) => 
    index === self.findIndex(e => e.id === entity.id)
  );

  return uniqueEntities;
}
