import { Profile } from '../entities/Profile';

/**
 * Port interface for Profile persistence
 */
export interface ProfileRepository {
  /**
   * Find a profile by ID
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * Find a profile by user ID
   */
  findByUserId(userId: string): Promise<Profile | null>;

  /**
   * Find a profile by handle
   */
  findByHandle(handle: string): Promise<Profile | null>;

  /**
   * Check if a handle is already taken
   */
  handleExists(handle: string): Promise<boolean>;

  /**
   * Search profiles by style tags
   */
  findByStyleTags(tags: string[], limit?: number): Promise<Profile[]>;

  /**
   * Search profiles by location
   */
  findByLocation(city?: string, country?: string, limit?: number): Promise<Profile[]>;

  /**
   * Get trending profiles
   */
  findTrending(limit?: number): Promise<Profile[]>;

  /**
   * Save a profile (create or update)
   */
  save(profile: Profile): Promise<void>;

  /**
   * Delete a profile
   */
  delete(id: string): Promise<void>;

  /**
   * Increment profile views
   */
  incrementViews(profileId: string): Promise<void>;

  /**
   * Get profile statistics
   */
  getStats(profileId: string): Promise<{
    totalViews: number;
    totalShowcases: number;
    totalGigs?: number;
    totalApplications?: number;
  }>;
}