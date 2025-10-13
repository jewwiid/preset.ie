/**
 * Image processing utilities
 * Handles optimization, compression, and format conversion
 */

/**
 * Convert image to base64 data URL
 */
export const imageToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Load image from URL
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Compress image using canvas
 */
export const compressImage = async (
  file: File | Blob,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
): Promise<Blob> => {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    format = 'jpeg'
  } = options

  // Load image
  const dataUrl = await imageToDataUrl(file)
  const img = await loadImage(dataUrl)

  // Calculate new dimensions
  let { width, height } = img
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  // Create canvas and draw
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(img, 0, 0, width, height)

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to compress image'))
      },
      `image/${format}`,
      quality
    )
  })
}

/**
 * Get image dimensions without loading the full image
 */
export const getImageDimensions = async (
  url: string
): Promise<{ width: number; height: number }> => {
  const img = await loadImage(url)
  return { width: img.naturalWidth, height: img.naturalHeight }
}

/**
 * Validate image format
 */
export const isValidImageFormat = (mimeType: string): boolean => {
  const validFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
  return validFormats.includes(mimeType)
}

/**
 * Validate video format
 */
export const isValidVideoFormat = (mimeType: string): boolean => {
  const validFormats = ['video/mp4', 'video/webm', 'video/quicktime']
  return validFormats.includes(mimeType)
}

/**
 * Convert image to specific format
 */
export const convertImageFormat = async (
  file: File | Blob,
  targetFormat: 'jpeg' | 'png' | 'webp',
  quality = 0.9
): Promise<Blob> => {
  const dataUrl = await imageToDataUrl(file)
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(img, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to convert image format'))
      },
      `image/${targetFormat}`,
      quality
    )
  })
}

/**
 * Optimize image for API upload
 * Reduces file size while maintaining quality
 */
export const optimizeForUpload = async (
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<{ blob: Blob; url: string; sizeReduction: number }> => {
  const originalSize = file.size

  const compressed = await compressImage(file, {
    maxWidth: options.maxWidth || 2048,
    maxHeight: options.maxHeight || 2048,
    quality: options.quality || 0.9,
    format: 'jpeg'
  })

  const url = URL.createObjectURL(compressed)
  const sizeReduction = ((originalSize - compressed.size) / originalSize) * 100

  return {
    blob: compressed,
    url,
    sizeReduction: Math.round(sizeReduction)
  }
}

/**
 * Create thumbnail from image
 */
export const createThumbnail = async (
  file: File | Blob,
  size = 400
): Promise<Blob> => {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    format: 'jpeg'
  })
}

/**
 * Preload images for better UX
 */
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map((url) =>
      loadImage(url)
        .then(() => {})
        .catch((err) => {
          console.warn(`Failed to preload image: ${url}`, err)
        })
    )
  )
}

/**
 * Extract dominant color from image
 */
export const extractDominantColor = async (url: string): Promise<string> => {
  const img = await loadImage(url)

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(img, 0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Calculate file size in human-readable format
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Estimate image processing time
 */
export const estimateProcessingTime = (fileSizeBytes: number): number => {
  // Rough estimate: 1 second per MB
  const sizeMB = fileSizeBytes / (1024 * 1024)
  return Math.max(1, Math.round(sizeMB))
}
