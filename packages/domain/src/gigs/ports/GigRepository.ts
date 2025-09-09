import { Gig } from '../entities/Gig';
import { GigStatus } from '../value-objects/GigStatus';

/**
 * Filter criteria for searching gigs
 */
export interface GigFilters {
  status?: GigStatus;
  ownerId?: string;
  location?: string;
  compensationType?: string;
  startDateAfter?: Date;
  startDateBefore?: Date;
  tags?: string[];
  boosted?: boolean;
}

/**
 * Port interface for Gig persistence
 */
export interface GigRepository {
  /**
   * Find a gig by ID
   */
  findById(id: string): Promise<Gig | null>;

  /**
   * Find gigs by owner
   */
  findByOwnerId(ownerId: string): Promise<Gig[]>;

  /**
   * Find published gigs with filters
   */
  findPublished(filters?: GigFilters, limit?: number, offset?: number): Promise<{
    gigs: Gig[];
    total: number;
  }>;

  /**
   * Find gigs near a location
   */
  findNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: GigFilters
  ): Promise<Gig[]>;

  /**
   * Find gigs by talent ID (where talent was booked)
   */
  findByTalentId(talentId: string): Promise<Gig[]>;

  /**
   * Search gigs by text
   */
  search(query: string, filters?: GigFilters): Promise<Gig[]>;

  /**
   * Get trending gigs
   */
  findTrending(limit?: number): Promise<Gig[]>;

  /**
   * Save a gig (create or update)
   */
  save(gig: Gig): Promise<void>;

  /**
   * Delete a gig
   */
  delete(id: string): Promise<void>;

  /**
   * Count gigs by owner this month
   */
  countByOwnerThisMonth(ownerId: string): Promise<number>;

  /**
   * Increment view count
   */
  incrementViews(gigId: string): Promise<void>;

  /**
   * Increment save count
   */
  incrementSaves(gigId: string): Promise<void>;

  /**
   * Get gig statistics
   */
  getStats(gigId: string): Promise<{
    views: number;
    saves: number;
    applications: number;
  }>;
}