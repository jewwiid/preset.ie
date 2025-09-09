import { Moodboard } from '../entities/Moodboard';

/**
 * Port interface for Moodboard persistence
 * This defines the contract that any persistence adapter must implement
 */
export interface MoodboardRepository {
  /**
   * Find a moodboard by its ID
   */
  findById(id: string): Promise<Moodboard | null>;
  
  /**
   * Find moodboards by gig ID
   */
  findByGigId(gigId: string): Promise<Moodboard[]>;
  
  /**
   * Find moodboards by owner ID
   */
  findByOwnerId(ownerId: string): Promise<Moodboard[]>;
  
  /**
   * Save a moodboard (create or update)
   */
  save(moodboard: Moodboard): Promise<void>;
  
  /**
   * Delete a moodboard
   */
  delete(id: string): Promise<void>;
  
  /**
   * Check if user has permission to modify moodboard
   */
  canUserModify(moodboardId: string, userId: string): Promise<boolean>;
}