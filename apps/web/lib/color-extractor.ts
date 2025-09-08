/**
 * Extract dominant colors from an image URL
 * Uses canvas to analyze pixel data client-side
 */
export async function extractColorPalette(imageUrl: string, colorCount: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // Enable CORS for external images
    
    img.onload = function() {
      try {
        // Create canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(getDefaultPalette())
          return
        }
        
        // Set canvas size - use smaller size for performance
        const maxSize = 100
        let width = img.width
        let height = img.height
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Get pixel data
        const imageData = ctx.getImageData(0, 0, width, height)
        const pixels = imageData.data
        
        // Color quantization using simple histogram
        const colorMap = new Map<string, number>()
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < pixels.length; i += 16) {
          const r = Math.round(pixels[i]! / 32) * 32     // Quantize to reduce colors
          const g = Math.round(pixels[i + 1]! / 32) * 32
          const b = Math.round(pixels[i + 2]! / 32) * 32
          const a = pixels[i + 3]!
          
          // Skip transparent/nearly transparent pixels
          if (a < 128) continue
          
          // Skip very dark or very light colors
          const brightness = (r + g + b) / 3
          if (brightness < 20 || brightness > 235) continue
          
          const hex = rgbToHex(r, g, b)
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1)
        }
        
        // Sort by frequency and get top colors
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, colorCount)
          .map(([color]) => color)
        
        // If we didn't get enough colors, add some defaults
        if (sortedColors.length < colorCount) {
          const defaults = getDefaultPalette()
          while (sortedColors.length < colorCount && defaults.length > 0) {
            const defaultColor = defaults.shift()
            if (defaultColor && !sortedColors.includes(defaultColor)) {
              sortedColors.push(defaultColor)
            }
          }
        }
        
        resolve(sortedColors)
      } catch (error) {
        console.error('Error extracting colors:', error)
        resolve(getDefaultPalette())
      }
    }
    
    img.onerror = function() {
      console.error('Failed to load image for color extraction')
      resolve(getDefaultPalette())
    }
    
    // Load the image
    img.src = imageUrl
  })
}

/**
 * Extract palette from multiple images
 */
export async function extractPaletteFromImages(imageUrls: string[], colorCount: number = 5): Promise<string[]> {
  if (imageUrls.length === 0) {
    return getDefaultPalette()
  }
  
  try {
    // Extract colors from first 3 images
    const imagesToProcess = imageUrls.slice(0, 3)
    const allColors: Map<string, number> = new Map()
    
    for (const url of imagesToProcess) {
      const colors = await extractColorPalette(url, 8)
      colors.forEach((color, index) => {
        // Weight colors by their position (more dominant = higher weight)
        const weight = 8 - index
        allColors.set(color, (allColors.get(color) || 0) + weight)
      })
    }
    
    // Sort by combined weight and return top colors
    const finalPalette = Array.from(allColors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount)
      .map(([color]) => color)
    
    return finalPalette.length > 0 ? finalPalette : getDefaultPalette()
  } catch (error) {
    console.error('Error extracting palette from images:', error)
    return getDefaultPalette()
  }
}

/**
 * Convert RGB to Hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Get default palette as fallback
 */
function getDefaultPalette(): string[] {
  return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
}

/**
 * Generate a complementary palette based on a single color
 */
export function generateComplementaryPalette(baseColor: string): string[] {
  // This is a simplified version - in production you'd use proper color theory
  const palette = [baseColor]
  
  // Parse the base color
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Generate variations
  // Lighter version
  palette.push(rgbToHex(
    Math.min(255, r + 40),
    Math.min(255, g + 40),
    Math.min(255, b + 40)
  ))
  
  // Darker version
  palette.push(rgbToHex(
    Math.max(0, r - 40),
    Math.max(0, g - 40),
    Math.max(0, b - 40)
  ))
  
  // Complementary color (opposite on color wheel)
  palette.push(rgbToHex(255 - r, 255 - g, 255 - b))
  
  // Analogous color
  palette.push(rgbToHex(
    Math.min(255, (r + 128) % 256),
    Math.min(255, (g + 64) % 256),
    b
  ))
  
  return palette
}