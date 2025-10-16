/**
 * Utility functions for aspect ratio calculations and formatting
 */

/**
 * Calculate grid style for masonry layout based on image dimensions
 */
export function getImageGridStyle(width: number, height: number) {
  const aspectRatio = width / height

  return {
    aspectRatio: aspectRatio.toString()
  }
}

/**
 * Convert numeric aspect ratio to readable format (e.g., "16:9")
 */
export function getAspectRatioLabel(width: number, height: number): string {
  // Handle invalid or missing dimensions
  if (!width || !height || width <= 0 || height <= 0) {
    return '1:1'
  }

  const aspectRatio = width / height

  // Common aspect ratios with more generous tolerance
  if (Math.abs(aspectRatio - 1) < 0.05) return '1:1'
  if (Math.abs(aspectRatio - 16 / 9) < 0.05) return '16:9'
  if (Math.abs(aspectRatio - 9 / 16) < 0.05) return '9:16'
  if (Math.abs(aspectRatio - 4 / 3) < 0.05) return '4:3'
  if (Math.abs(aspectRatio - 3 / 4) < 0.05) return '3:4'
  if (Math.abs(aspectRatio - 21 / 9) < 0.05) return '21:9'
  if (Math.abs(aspectRatio - 3 / 2) < 0.05) return '3:2'
  if (Math.abs(aspectRatio - 2 / 3) < 0.05) return '2:3'
  if (Math.abs(aspectRatio - 5 / 4) < 0.05) return '5:4'
  if (Math.abs(aspectRatio - 4 / 5) < 0.05) return '4:5'

  // For other ratios, find the closest simple ratio
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  const w = Math.round(width / divisor)
  const h = Math.round(height / divisor)

  // If the ratio is too complex, show decimal
  if (w > 32 || h > 32) {
    return aspectRatio.toFixed(2) + ':1'
  }

  return `${w}:${h}`
}
