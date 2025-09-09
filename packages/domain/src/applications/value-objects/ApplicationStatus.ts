/**
 * Status of an application through its lifecycle
 */
export enum ApplicationStatus {
  PENDING = 'pending',         // Initial state after submission
  SHORTLISTED = 'shortlisted', // Contributor has shortlisted the applicant
  ACCEPTED = 'accepted',       // Talent has been booked for the gig
  DECLINED = 'declined',       // Application was declined
  WITHDRAWN = 'withdrawn'      // Applicant withdrew their application
}

/**
 * Check if an application is still active
 */
export function isActive(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.PENDING || 
         status === ApplicationStatus.SHORTLISTED;
}

/**
 * Check if an application has been finalized
 */
export function isFinalized(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.ACCEPTED || 
         status === ApplicationStatus.DECLINED ||
         status === ApplicationStatus.WITHDRAWN;
}

/**
 * Get valid status transitions
 */
export function getValidTransitions(currentStatus: ApplicationStatus): ApplicationStatus[] {
  switch (currentStatus) {
    case ApplicationStatus.PENDING:
      return [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.DECLINED,
        ApplicationStatus.WITHDRAWN
      ];
    
    case ApplicationStatus.SHORTLISTED:
      return [
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.DECLINED,
        ApplicationStatus.WITHDRAWN
      ];
    
    case ApplicationStatus.ACCEPTED:
    case ApplicationStatus.DECLINED:
    case ApplicationStatus.WITHDRAWN:
      return []; // Terminal states
    
    default:
      return [];
  }
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  const validTransitions = getValidTransitions(from);
  return validTransitions.includes(to);
}