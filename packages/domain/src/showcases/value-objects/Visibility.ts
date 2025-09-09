/**
 * Visibility levels for showcases
 */
export enum Visibility {
  PRIVATE = 'private',   // Only visible to creator and talent
  PUBLIC = 'public',     // Visible on profiles and in search
  UNLISTED = 'unlisted'  // Accessible via direct link only
}

/**
 * Check if showcase is publicly visible
 */
export function isPubliclyVisible(visibility: Visibility): boolean {
  return visibility === Visibility.PUBLIC;
}

/**
 * Check if showcase needs approval before publishing
 */
export function needsApproval(visibility: Visibility): boolean {
  return visibility === Visibility.PUBLIC;
}