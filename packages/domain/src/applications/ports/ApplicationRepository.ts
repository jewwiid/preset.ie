import { Application } from '../entities/application';
import { ApplicationStatus } from '../value-objects/ApplicationStatus';

/**
 * Filter criteria for searching applications
 */
export interface ApplicationFilters {
  gigId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
  appliedAfter?: Date;
  appliedBefore?: Date;
}

/**
 * Port interface for Application persistence
 */
export interface ApplicationRepository {
  /**
   * Find an application by ID
   */
  findById(id: string): Promise<Application | null>;

  /**
   * Find applications by gig
   */
  findByGigId(gigId: string): Promise<Application[]>;

  /**
   * Find applications by applicant
   */
  findByApplicantId(applicantId: string): Promise<Application[]>;

  /**
   * Find an existing application by gig and applicant
   */
  findByGigAndApplicant(gigId: string, applicantId: string): Promise<Application | null>;

  /**
   * Find applications with filters
   */
  find(filters: ApplicationFilters, limit?: number, offset?: number): Promise<{
    applications: Application[];
    total: number;
  }>;

  /**
   * Count applications by applicant this month
   */
  countByApplicantThisMonth(applicantId: string): Promise<number>;

  /**
   * Count applications by gig
   */
  countByGig(gigId: string): Promise<number>;

  /**
   * Count shortlisted applications by gig
   */
  countShortlistedByGig(gigId: string): Promise<number>;

  /**
   * Get application statistics for a gig
   */
  getGigStats(gigId: string): Promise<{
    total: number;
    pending: number;
    shortlisted: number;
    accepted: number;
    declined: number;
    withdrawn: number;
  }>;

  /**
   * Get application statistics for an applicant
   */
  getApplicantStats(applicantId: string): Promise<{
    total: number;
    pending: number;
    shortlisted: number;
    accepted: number;
    declined: number;
    withdrawn: number;
  }>;

  /**
   * Save an application (create or update)
   */
  save(application: Application): Promise<void>;

  /**
   * Delete an application
   */
  delete(id: string): Promise<void>;

  /**
   * Check if user has already applied to a gig
   */
  hasApplied(gigId: string, applicantId: string): Promise<boolean>;

  /**
   * Get recent applications for dashboard
   */
  findRecent(userId: string, role: 'applicant' | 'gigOwner', limit?: number): Promise<Application[]>;
}