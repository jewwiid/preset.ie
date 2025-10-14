import { StitchPreset } from '../types/stitch-preset';
import { StitchImage } from '../app/components/playground/StitchImageManager';

export function buildStitchPrompt(
  preset: StitchPreset,
  images: StitchImage[],
  maxImages: number,
  customPrompt?: string
): { prompt: string; warnings: string[] } {
  const warnings: string[] = [];
  
  // Map images by type
  const imageTypeMap = new Map<string, number>();
  images.forEach((img) => {
    const type = img.type === 'custom' && img.customLabel ? img.customLabel : img.type;
    imageTypeMap.set(type, (imageTypeMap.get(type) || 0) + 1);
  });
  
  // Validate required types
  preset.required_image_types.forEach((type) => {
    if (!imageTypeMap.has(type)) {
      warnings.push(`Missing required image type: ${type}`);
    }
  });
  
  // Build prompt from template or use custom
  let prompt = customPrompt || preset.prompt_template;
  
  // Replace {count}
  prompt = prompt.replace(/{count}/g, maxImages.toString());
  
  // Replace image type placeholders
  preset.required_image_types.forEach((type) => {
    const count = imageTypeMap.get(type) || 0;
    const descriptor = count === 1 ? `the ${type}` : `${count} ${type}s`;
    prompt = prompt.replace(new RegExp(`\\{${type}\\}`, 'g'), descriptor);
  });
  
  preset.optional_image_types?.forEach((type) => {
    const count = imageTypeMap.get(type) || 0;
    if (count > 0) {
      const descriptor = count === 1 ? `the ${type}` : `${count} ${type}s`;
      prompt = prompt.replace(new RegExp(`\\{${type}\\}`, 'g'), descriptor);
    } else {
      // Remove optional placeholders
      prompt = prompt.replace(new RegExp(`\\{${type}\\}[^,]*,?\\s*`, 'g'), '');
    }
  });
  
  // Clean up
  prompt = prompt.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').trim();
  
  return { prompt, warnings };
}

export function validateStitchPreset(
  preset: StitchPreset,
  images: StitchImage[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const imageTypes = new Set(images.map(img => 
    img.type === 'custom' && img.customLabel ? img.customLabel : img.type
  ));
  
  preset.required_image_types.forEach(type => {
    if (!imageTypes.has(type)) {
      errors.push(`Required image type missing: ${type}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

