/**
 * Preset Create Module - Prompt Helpers
 *
 * Utilities for generating and enhancing prompts.
 */

import type { PresetData } from '../types';

/**
 * Generate enhanced prompt by replacing placeholders
 */
export function generateEnhancedPrompt(presetData: PresetData): string {
  let enhancedPrompt = presetData.prompt_template;

  // Replace placeholders with actual values
  enhancedPrompt = enhancedPrompt.replace(
    /\{subject\}/g,
    presetData.prompt_subject || '{subject}'
  );
  enhancedPrompt = enhancedPrompt.replace(
    /\{style\}/g,
    presetData.ai_metadata.style || '{style}'
  );
  enhancedPrompt = enhancedPrompt.replace(
    /\{mood\}/g,
    presetData.ai_metadata.mood || '{mood}'
  );

  // Add image reference if provided
  if (presetData.prompt_image_url) {
    enhancedPrompt += ` [Image: ${presetData.prompt_image_url}]`;
  }

  return enhancedPrompt;
}

/**
 * Generate enhanced video prompt
 */
export function generateEnhancedVideoPrompt(presetData: PresetData): string {
  if (!presetData.prompt_template_video) {
    return '';
  }

  let enhancedPrompt = presetData.prompt_template_video;

  // Replace placeholders
  enhancedPrompt = enhancedPrompt.replace(
    /\{subject\}/g,
    presetData.prompt_subject || '{subject}'
  );
  enhancedPrompt = enhancedPrompt.replace(
    /\{style\}/g,
    presetData.ai_metadata.style || '{style}'
  );
  enhancedPrompt = enhancedPrompt.replace(
    /\{mood\}/g,
    presetData.ai_metadata.mood || '{mood}'
  );

  return enhancedPrompt;
}

/**
 * Validate prompt template
 */
export function validatePromptTemplate(template: string): boolean {
  if (!template || template.trim() === '') {
    return false;
  }

  // Check for balanced placeholders
  const placeholders = template.match(/\{[a-z_]+\}/g) || [];
  return placeholders.length > 0;
}

/**
 * Extract placeholders from template
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{([a-z_]+)\}/g) || [];
  return matches.map((match) => match.slice(1, -1));
}

/**
 * Check if all required placeholders are filled
 */
export function areAllPlaceholdersFilled(
  template: string,
  presetData: PresetData
): boolean {
  const placeholders = extractPlaceholders(template);

  for (const placeholder of placeholders) {
    switch (placeholder) {
      case 'subject':
        if (!presetData.prompt_subject) return false;
        break;
      case 'style':
        if (!presetData.ai_metadata.style) return false;
        break;
      case 'mood':
        if (!presetData.ai_metadata.mood) return false;
        break;
    }
  }

  return true;
}
