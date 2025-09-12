import { UserBlock } from '../entities/UserBlock';

/**
 * Repository port for UserBlock persistence
 */
export interface UserBlockRepository {
  /**
   * Save a new user block
   */
  save(userBlock: UserBlock): Promise<void>;

  /**
   * Find a user block by ID
   */
  findById(id: string): Promise<UserBlock | null>;

  /**
   * Find a block between two specific users (if exists)
   */
  findBlockBetweenUsers(blockerUserId: string, blockedUserId: string): Promise<UserBlock | null>;

  /**
   * Check if one user has blocked another
   */
  isUserBlocked(blockerUserId: string, blockedUserId: string): Promise<boolean>;

  /**
   * Check if two users can communicate (neither has blocked the other)
   */
  canUsersCommunicate(userId1: string, userId2: string): Promise<boolean>;

  /**
   * Get all users blocked by a specific user
   */
  getBlockedUsers(blockerUserId: string, options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserBlock[]>;

  /**
   * Get all users who have blocked a specific user (admin/self only)
   */
  getUsersBlockingUser(blockedUserId: string, requestingUserId: string, options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserBlock[]>;

  /**
   * Get all blocks involving a user (as blocker or blocked)
   */
  getUserBlocks(userId: string, options?: {
    asBlocker?: boolean;
    asBlocked?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserBlock[]>;

  /**
   * Get recent blocks by a user (for spam detection)
   */
  getRecentBlocksByUser(blockerUserId: string, withinDays: number): Promise<UserBlock[]>;

  /**
   * Get blocks with specific reasons (for analytics)
   */
  getBlocksByReason(reason: string, options?: {
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<UserBlock[]>;

  /**
   * Count total blocks created by a user
   */
  countBlocksCreatedByUser(blockerUserId: string): Promise<number>;

  /**
   * Count total blocks received by a user
   */
  countBlocksReceivedByUser(blockedUserId: string): Promise<number>;

  /**
   * Remove a user block (unblock)
   */
  remove(userBlock: UserBlock): Promise<void>;

  /**
   * Remove a block by ID
   */
  removeById(id: string): Promise<boolean>;

  /**
   * Remove all blocks between two users (mutual unblock)
   */
  removeBlocksBetweenUsers(userId1: string, userId2: string): Promise<number>;

  /**
   * Update an existing user block
   */
  update(userBlock: UserBlock): Promise<void>;

  /**
   * Find blocks that are candidates for automatic expiration
   * (if the platform implements time-based block expiration)
   */
  findExpiredBlocks(olderThanDays: number): Promise<UserBlock[]>;

  /**
   * Check if user has reached blocking limits (anti-abuse)
   */
  hasExceededBlockingLimits(userId: string, config: {
    maxBlocksPerDay?: number;
    maxBlocksPerMonth?: number;
    maxTotalBlocks?: number;
  }): Promise<boolean>;

  /**
   * Get blocking statistics for analytics
   */
  getBlockingStats(options?: {
    fromDate?: Date;
    toDate?: Date;
    groupBy?: 'day' | 'week' | 'month' | 'reason';
  }): Promise<Array<{
    period?: string;
    reason?: string;
    count: number;
  }>>;

  /**
   * Find mutual blocks (where A blocked B and B blocked A)
   */
  findMutualBlocks(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Array<{
    userId1: string;
    userId2: string;
    block1: UserBlock;
    block2: UserBlock;
  }>>;
}