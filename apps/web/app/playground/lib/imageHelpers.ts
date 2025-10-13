/**
 * Helper functions for image handling
 */

import type { GeneratedImage, ImageGenerationMetadata, PlaygroundProject } from '../types'

/**
 * Safely extract URL from image object or string
 */
export function getImageUrl(imageUrl: any): string {
  if (typeof imageUrl === 'string') return imageUrl
  if (typeof imageUrl === 'object' && imageUrl !== null) {
    return imageUrl.url || imageUrl.image_url || ''
  }
  return ''
}

/**
 * Check if a URL is a video based on file extension
 */
export function isVideoUrl(url: string): boolean {
  return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')
}

/**
 * Generate image generation metadata from current project
 */
export function buildImageGenerationMetadata(
  project: PlaygroundProject | null
): ImageGenerationMetadata {
  if (!project) {
    return {
      prompt: '',
      style: 'realistic',
      aspect_ratio: '1:1',
      resolution: '1024x1024',
      consistency_level: 'high',
      generation_mode: 'text-to-image',
      api_endpoint: 'seedream-v4',
      credits_used: 0,
      generated_at: new Date().toISOString(),
    }
  }

  return {
    prompt: project.prompt,
    style: project.style || 'realistic',
    aspect_ratio: project.aspect_ratio || '1:1',
    resolution: project.resolution || '1024x1024',
    consistency_level: project.metadata?.consistency_level || 'high',
    enhanced_prompt: project.metadata?.enhanced_prompt || project.prompt,
    style_applied: project.metadata?.style_applied || project.style,
    style_prompt: project.metadata?.style_prompt || '',
    custom_style_preset: project.metadata?.custom_style_preset || null,
    generation_mode: project.metadata?.generation_mode || 'text-to-image',
    base_image: project.metadata?.base_image || null,
    api_endpoint: project.metadata?.api_endpoint || 'seedream-v4',
    credits_used: project.credits_used || 0,
    generated_at: project.last_generated_at || new Date().toISOString(),
    cinematic_parameters: project.metadata?.cinematic_parameters || null,
    include_technical_details: project.metadata?.include_technical_details || false,
    include_style_references: project.metadata?.include_style_references || false,
    intensity: project.metadata?.intensity || 1.0,
    provider: project.metadata?.provider || 'seedream',
    actual_width: project.generated_images?.[0]?.width || 1024,
    actual_height: project.generated_images?.[0]?.height || 1024,
  }
}

/**
 * Filter images by type
 */
export function filterImagesByType(
  images: GeneratedImage[],
  type?: 'base' | 'edit' | 'video'
): GeneratedImage[] {
  if (!type) return images
  return images.filter((img) => img.type === type)
}

/**
 * Add new image to project
 */
export function addImageToProject(
  project: PlaygroundProject,
  newImage: GeneratedImage
): PlaygroundProject {
  return {
    ...project,
    generated_images: [...project.generated_images, newImage],
  }
}

/**
 * Replace images in project by type
 */
export function replaceImagesInProject(
  project: PlaygroundProject,
  newImages: GeneratedImage[],
  keepType?: 'base' | 'edit'
): PlaygroundProject {
  const filteredImages = keepType
    ? project.generated_images.filter((img) => img.type === keepType)
    : []

  return {
    ...project,
    generated_images: [...filteredImages, ...newImages],
  }
}

/**
 * Create image entry from URL
 */
export function createImageEntry(
  url: string,
  type: 'base' | 'edit' | 'video' = 'base',
  width = 1024,
  height = 1024
): GeneratedImage {
  return {
    url,
    width,
    height,
    generated_at: new Date().toISOString(),
    type,
  }
}

/**
 * Check if image is a generated image (not base)
 */
export function isGeneratedImage(
  image: GeneratedImage,
  allImages: GeneratedImage[]
): boolean {
  const foundImage = allImages.find((img) => img.url === image.url)
  return foundImage ? foundImage.type !== 'base' : false
}
