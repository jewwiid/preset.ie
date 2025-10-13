/**
 * Moodboard module barrel export
 * Main entry point for the moodboard system
 */

// Types (primary source)
export * from './lib/moodboardTypes'

// Constants
export * from './constants/moodboardConfig'

// Helpers (primary source for getImageDimensions)
export * from './lib/moodboardHelpers'

// Business Logic - Export specific items to avoid conflicts
export {
  imageToDataUrl,
  loadImage,
  compressImage,
  // getImageDimensions - already exported from moodboardHelpers
  isValidImageFormat,
  isValidVideoFormat,
  convertImageFormat,
  optimizeForUpload,
  createThumbnail,
  preloadImages,
  extractDominantColor,
  formatBytes,
  estimateProcessingTime
} from './lib/imageProcessing'

export {
  searchPexels,
  formatPexelsPhoto,
  getPexelsPhoto,
  getCuratedPexels,
  getPexelsAttribution,
  getPexelsPhotographerUrl,
  validatePexelsFilters,
  calculateTotalPages
} from './lib/pexelsClient'

export {
  requestEnhancement,
  checkEnhancementStatus,
  pollEnhancementStatus,
  cancelEnhancement,
  discardEnhancement,
  getEnhancementCost,
  getEnhancementTimeEstimate,
  parseEnhancementError,
  getErrorMessage,
  validateEnhancementRequest
  // EnhancementRequest, EnhancementTask - already exported from moodboardTypes
} from './lib/enhancementClient'

// Hooks
export * from './hooks'

// Components
export * from './components'

// Main component
export { default as MoodboardBuilder } from './MoodboardBuilder'
