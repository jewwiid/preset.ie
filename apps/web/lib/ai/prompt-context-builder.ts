/**
 * LLM Context Builder
 * 
 * Builds rich context for AI enhancement that preserves mention meaning
 * and provides structured information about the user's intent.
 */

import type { ParsedMention } from '@/lib/utils/universal-mention-parser';
import type { MentionableEntity } from '@/lib/utils/mention-types';
import type { CinematicParameters } from '@preset/types';

export interface PromptContextMetadata {
  mode: string;
  cinematicParams?: CinematicParameters;
  sourceImages?: string[];
  currentPreset?: any;
  userIntent?: string;
  timestamp?: Date;
}

export interface PromptContext {
  originalText: string;
  enhancedText: string;
  mentions: ParsedMention[];
  metadata: PromptContextMetadata;
  structuredContext: string;
  confidence: number;
}

/**
 * Build structured context string for LLM
 */
export function buildPromptContext(
  text: string,
  mentions: ParsedMention[],
  metadata: PromptContextMetadata
): string {
  const contextParts: string[] = [];
  
  // Add mode context
  contextParts.push(`Mode: ${metadata.mode}`);
  
  // Add mention context
  if (mentions.length > 0) {
    contextParts.push('\nDetected mentions:');
    mentions.forEach(mention => {
      const entity = mention.entity;
      const category = entity.metadata?.category || 'Unknown';
      const subcategory = entity.metadata?.subcategory || '';
      const confidence = Math.round(mention.confidence * 100);
      
      contextParts.push(`- @${entity.label} (${category}${subcategory ? ` - ${subcategory}` : ''}) - ${confidence}% confidence`);
    });
  }
  
  // Add cinematic parameters context
  if (metadata.cinematicParams) {
    contextParts.push('\nCinematic parameters:');
    const params = metadata.cinematicParams;
    
    if (params.cameraAngle) contextParts.push(`- Camera angle: ${params.cameraAngle}`);
    if (params.lensType) contextParts.push(`- Lens type: ${params.lensType}`);
    if (params.shotSize) contextParts.push(`- Shot size: ${params.shotSize}`);
    if (params.lightingStyle) contextParts.push(`- Lighting: ${params.lightingStyle}`);
    if (params.colorPalette) contextParts.push(`- Color palette: ${params.colorPalette}`);
    if (params.directorStyle) contextParts.push(`- Director style: ${params.directorStyle}`);
    if (params.sceneMood) contextParts.push(`- Scene mood: ${params.sceneMood}`);
    if (params.aspectRatio) contextParts.push(`- Aspect ratio: ${params.aspectRatio}`);
    if (params.timeSetting) contextParts.push(`- Time setting: ${params.timeSetting}`);
    if (params.weatherCondition) contextParts.push(`- Weather: ${params.weatherCondition}`);
    if (params.locationType) contextParts.push(`- Location: ${params.locationType}`);
  }
  
  // Add source images context
  if (metadata.sourceImages && metadata.sourceImages.length > 0) {
    contextParts.push(`\nSource images: ${metadata.sourceImages.length} selected`);
    metadata.sourceImages.forEach((imageId, index) => {
      contextParts.push(`- Image ${index + 1}: ${imageId}`);
    });
  }
  
  // Add current preset context
  if (metadata.currentPreset) {
    contextParts.push(`\nCurrent preset: ${metadata.currentPreset.name || 'Custom'}`);
    if (metadata.currentPreset.description) {
      contextParts.push(`- Description: ${metadata.currentPreset.description}`);
    }
  }
  
  // Add user intent if provided
  if (metadata.userIntent) {
    contextParts.push(`\nUser intent: ${metadata.userIntent}`);
  }
  
  // Add timestamp
  if (metadata.timestamp) {
    contextParts.push(`\nTimestamp: ${metadata.timestamp.toISOString()}`);
  }
  
  return contextParts.join('\n');
}

/**
 * Build enhanced prompt with mention context
 */
export function buildEnhancedPrompt(
  originalText: string,
  mentions: ParsedMention[],
  metadata: PromptContextMetadata
): PromptContext {
  const structuredContext = buildPromptContext(originalText, mentions, metadata);
  
  // Calculate overall confidence based on mention confidences
  const confidence = mentions.length > 0 
    ? mentions.reduce((sum, mention) => sum + mention.confidence, 0) / mentions.length 
    : 0.5;
  
  // Build enhanced text with context
  const enhancedText = `${originalText}\n\nContext:\n${structuredContext}`;
  
  return {
    originalText,
    enhancedText,
    mentions,
    metadata,
    structuredContext,
    confidence
  };
}

/**
 * Build context for AI enhancement that preserves mention meaning
 */
export function buildAIEnhancementContext(
  text: string,
  mentions: ParsedMention[],
  metadata: PromptContextMetadata
): string {
  const contextParts: string[] = [];
  
  // Start with the original prompt
  contextParts.push(`Original prompt: "${text}"`);
  
  // Add mention explanations
  if (mentions.length > 0) {
    contextParts.push('\nMention explanations:');
    mentions.forEach(mention => {
      const entity = mention.entity;
      const category = entity.metadata?.category || 'Unknown';
      const description = entity.metadata?.description || entity.label;
      
      contextParts.push(`- @${entity.label}: ${description} (${category})`);
    });
  }
  
  // Add mode-specific context
  switch (metadata.mode) {
    case 'text-to-image':
      contextParts.push('\nContext: User wants to generate an image from text description.');
      break;
    case 'image-to-image':
      contextParts.push('\nContext: User wants to modify an existing image.');
      break;
    case 'video':
      contextParts.push('\nContext: User wants to generate or modify video content.');
      break;
    case 'edit':
      contextParts.push('\nContext: User wants to edit an existing image.');
      break;
    case 'batch':
      contextParts.push('\nContext: User wants to process multiple variations.');
      break;
  }
  
  // Add cinematic context if available
  if (metadata.cinematicParams) {
    contextParts.push('\nCinematic style context:');
    const params = metadata.cinematicParams;
    
    if (params.directorStyle) {
      contextParts.push(`- Director style: ${params.directorStyle} (influences composition, lighting, and mood)`);
    }
    if (params.lightingStyle) {
      contextParts.push(`- Lighting: ${params.lightingStyle} (affects atmosphere and mood)`);
    }
    if (params.colorPalette) {
      contextParts.push(`- Color palette: ${params.colorPalette} (defines overall color scheme)`);
    }
    if (params.sceneMood) {
      contextParts.push(`- Scene mood: ${params.sceneMood} (sets emotional tone)`);
    }
  }
  
  // Add source image context
  if (metadata.sourceImages && metadata.sourceImages.length > 0) {
    contextParts.push(`\nSource images: ${metadata.sourceImages.length} image(s) are referenced in this prompt.`);
  }
  
  return contextParts.join('\n');
}

/**
 * Build context for mention detection
 */
export function buildMentionDetectionContext(
  text: string,
  availableEntities: MentionableEntity[],
  metadata: PromptContextMetadata
): string {
  const contextParts: string[] = [];
  
  // Add the text to analyze
  contextParts.push(`Text to analyze: "${text}"`);
  
  // Add available entities
  contextParts.push('\nAvailable entities to recognize:');
  const categorizedEntities = availableEntities.reduce((acc, entity) => {
    const category = entity.metadata?.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(entity);
    return acc;
  }, {} as Record<string, MentionableEntity[]>);
  
  Object.entries(categorizedEntities).forEach(([category, entities]) => {
    contextParts.push(`\n${category}:`);
    entities.forEach(entity => {
      contextParts.push(`- ${entity.label}: ${entity.metadata?.description || entity.value}`);
    });
  });
  
  // Add mode context
  contextParts.push(`\nMode: ${metadata.mode}`);
  
  // Add instructions
  contextParts.push('\nInstructions:');
  contextParts.push('- Only add @mentions for entities that are clearly referenced in the text');
  contextParts.push('- Use the exact label from the available entities list');
  contextParts.push('- Preserve the original meaning and flow of the text');
  contextParts.push('- Be conservative - only mention entities you are confident about');
  
  return contextParts.join('\n');
}

/**
 * Build context for cross-tab mention sharing
 */
export function buildCrossTabContext(
  fromTab: string,
  toTab: string,
  mentions: ParsedMention[],
  metadata: PromptContextMetadata
): string {
  const contextParts: string[] = [];
  
  contextParts.push(`Sharing mentions from ${fromTab} to ${toTab}`);
  contextParts.push(`Mode: ${metadata.mode}`);
  
  if (mentions.length > 0) {
    contextParts.push('\nShared mentions:');
    mentions.forEach(mention => {
      const entity = mention.entity;
      const category = entity.metadata?.category || 'Unknown';
      contextParts.push(`- @${entity.label} (${category})`);
    });
  }
  
  // Add compatibility notes
  contextParts.push('\nCompatibility notes:');
  if (fromTab === 'generate' && toTab === 'video') {
    contextParts.push('- Image generation mentions can be adapted for video');
    contextParts.push('- Consider adding motion and timing parameters');
  } else if (fromTab === 'video' && toTab === 'generate') {
    contextParts.push('- Video mentions can be simplified for image generation');
    contextParts.push('- Motion parameters will be ignored');
  } else if (fromTab === 'edit' && toTab === 'generate') {
    contextParts.push('- Edit operations will be converted to generation parameters');
  }
  
  return contextParts.join('\n');
}

/**
 * Validate and clean context
 */
export function validatePromptContext(context: PromptContext): PromptContext {
  // Clean up text
  const cleanedText = context.originalText.trim();
  const cleanedEnhancedText = context.enhancedText.trim();
  
  // Validate mentions
  const validMentions = context.mentions.filter(mention => 
    mention.entity && 
    mention.entity.label && 
    mention.confidence >= 0.1
  );
  
  // Ensure confidence is within bounds
  const validConfidence = Math.min(Math.max(context.confidence, 0), 1);
  
  return {
    ...context,
    originalText: cleanedText,
    enhancedText: cleanedEnhancedText,
    mentions: validMentions,
    confidence: validConfidence
  };
}

/**
 * Build context summary for logging/analytics
 */
export function buildContextSummary(context: PromptContext): string {
  const parts: string[] = [];
  
  parts.push(`Mode: ${context.metadata.mode}`);
  parts.push(`Mentions: ${context.mentions.length}`);
  parts.push(`Confidence: ${Math.round(context.confidence * 100)}%`);
  
  if (context.metadata.cinematicParams) {
    const paramCount = Object.keys(context.metadata.cinematicParams).length;
    parts.push(`Cinematic params: ${paramCount}`);
  }
  
  if (context.metadata.sourceImages) {
    parts.push(`Source images: ${context.metadata.sourceImages.length}`);
  }
  
  return parts.join(' | ');
}
