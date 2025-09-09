import { User } from '../entities/User';

/**
 * Port interface for User persistence
 */
export interface UserRepository {
  /**
   * Find a user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find multiple users by IDs
   */
  findByIds(ids: string[]): Promise<User[]>;

  /**
   * Check if an email is already in use
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Save a user (create or update)
   */
  save(user: User): Promise<void>;

  /**
   * Delete a user
   */
  delete(id: string): Promise<void>;

  /**
   * Count users by subscription tier
   */
  countBySubscriptionTier(tier: string): Promise<number>;

  /**
   * Find users with expired subscriptions
   */
  findExpiredSubscriptions(date: Date): Promise<User[]>;

  /**
   * Find suspended users with expired suspensions
   */
  findExpiredSuspensions(date: Date): Promise<User[]>;
}