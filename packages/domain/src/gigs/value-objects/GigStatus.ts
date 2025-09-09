/**
 * Status of a gig in its lifecycle
 */
export enum GigStatus {
  DRAFT = 'draft',           // Not yet published
  PUBLISHED = 'published',   // Open for applications
  CLOSED = 'closed',         // No longer accepting applications
  BOOKED = 'booked',         // Talent has been selected
  COMPLETED = 'completed',   // Shoot has been completed
  CANCELLED = 'cancelled'    // Gig was cancelled
}

/**
 * Check if a status allows applications
 */
export function canAcceptApplications(status: GigStatus): boolean {
  return status === GigStatus.PUBLISHED;
}

/**
 * Check if a status allows editing
 */
export function canEdit(status: GigStatus): boolean {
  return status === GigStatus.DRAFT || status === GigStatus.PUBLISHED;
}

/**
 * Check if a gig is active
 */
export function isActive(status: GigStatus): boolean {
  return status === GigStatus.PUBLISHED || 
         status === GigStatus.CLOSED || 
         status === GigStatus.BOOKED;
}

/**
 * Get valid status transitions
 */
export function getValidTransitions(currentStatus: GigStatus): GigStatus[] {
  switch (currentStatus) {
    case GigStatus.DRAFT:
      return [GigStatus.PUBLISHED, GigStatus.CANCELLED];
    
    case GigStatus.PUBLISHED:
      return [GigStatus.CLOSED, GigStatus.BOOKED, GigStatus.CANCELLED];
    
    case GigStatus.CLOSED:
      return [GigStatus.PUBLISHED, GigStatus.BOOKED, GigStatus.CANCELLED];
    
    case GigStatus.BOOKED:
      return [GigStatus.COMPLETED, GigStatus.CANCELLED];
    
    case GigStatus.COMPLETED:
      return []; // Terminal state
    
    case GigStatus.CANCELLED:
      return []; // Terminal state
    
    default:
      return [];
  }
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: GigStatus, to: GigStatus): boolean {
  const validTransitions = getValidTransitions(from);
  return validTransitions.includes(to);
}