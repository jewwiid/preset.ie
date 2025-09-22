/**
 * Utility functions for handling preset sample images
 * This ensures sample images are copied to dedicated storage to prevent broken references
 */

export interface SampleImageData {
  before_images: string[]
  after_images: string[]
  descriptions: string[]
}

/**
 * Copies sample images to the preset_images table to ensure persistence
 * @param presetId - The ID of the preset
 * @param sampleImages - The sample images data
 * @param authToken - The user's authentication token
 * @returns Promise<boolean> - Success status
 */
export async function copySampleImagesToPresetStorage(
  presetId: string,
  sampleImages: SampleImageData,
  authToken: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/presets/copy-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        presetId,
        sampleImages
      })
    })

    if (!response.ok) {
      console.error('Failed to copy sample images:', await response.text())
      return false
    }

    const result = await response.json()
    console.log(`Successfully copied ${result.count} sample images for preset ${presetId}`)
    return true
  } catch (error) {
    console.error('Error copying sample images:', error)
    return false
  }
}

/**
 * Fetches sample images for a preset from the dedicated storage
 * @param presetId - The ID of the preset
 * @param authToken - The user's authentication token
 * @returns Promise<SampleImageData | null> - The sample images data or null if failed
 */
export async function fetchSampleImagesFromPresetStorage(
  presetId: string,
  authToken: string
): Promise<SampleImageData | null> {
  try {
    const response = await fetch(`/api/presets/copy-images?presetId=${presetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch sample images:', await response.text())
      return null
    }

    const result = await response.json()
    return result.sample_images || null
  } catch (error) {
    console.error('Error fetching sample images:', error)
    return null
  }
}

/**
 * Creates sample image data from image metadata
 * @param metadata - The image generation metadata
 * @param imageUrl - The generated image URL
 * @returns SampleImageData - The formatted sample image data
 */
export function createSampleImageDataFromMetadata(
  metadata: any,
  imageUrl: string
): SampleImageData {
  return {
    before_images: metadata.base_image ? [metadata.base_image] : [],
    after_images: [imageUrl],
    descriptions: [
      metadata.base_image ? 'Original input image' : '',
      'Generated result'
    ].filter(Boolean)
  }
}

/**
 * Validates that sample image URLs are accessible
 * @param sampleImages - The sample images data to validate
 * @returns Promise<SampleImageData> - The validated sample images data
 */
export async function validateSampleImages(sampleImages: SampleImageData): Promise<SampleImageData> {
  const validateUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok ? url : null
    } catch {
      return null
    }
  }

  const validatedBeforeImages = await Promise.all(
    sampleImages.before_images.map(validateUrl)
  ).then(results => results.filter(Boolean) as string[])

  const validatedAfterImages = await Promise.all(
    sampleImages.after_images.map(validateUrl)
  ).then(results => results.filter(Boolean) as string[])

  return {
    before_images: validatedBeforeImages,
    after_images: validatedAfterImages,
    descriptions: sampleImages.descriptions.slice(0, validatedBeforeImages.length + validatedAfterImages.length)
  }
}
