import { SupabaseClient } from '@supabase/supabase-js';
import { UserBlock } from '@preset/domain/collaboration/entities/UserBlock';
import { UserBlockRepository } from '@preset/domain/collaboration/ports/UserBlockRepository';
import { BlockReason, BlockReasonDetails } from '@preset/domain/collaboration/value-objects/BlockReason';

export class SupabaseUserBlockRepository implements UserBlockRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(userBlock: UserBlock): Promise<void> {
    const data = {
      id: userBlock.getId(),
      blocker_user_id: userBlock.getBlockerUserId(),
      blocked_user_id: userBlock.getBlockedUserId(),
      reason: userBlock.getReasonDetails().getReason(),
      details: userBlock.getReasonDetails().getDetails(),
      created_at: userBlock.getCreatedAt().toISOString(),
      updated_at: userBlock.getUpdatedAt().toISOString()
    };

    const { error } = await this.supabase
      .from('user_blocks')
      .insert(data);

    if (error) {
      throw new Error(`Failed to save user block: ${error.message}`);
    }
  }

  async findById(id: string): Promise<UserBlock | null> {
    const { data, error } = await this.supabase
      .from('user_blocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user block: ${error.message}`);
    }

    return this.mapToUserBlock(data);
  }

  async findBlockBetweenUsers(blockerUserId: string, blockedUserId: string): Promise<UserBlock | null> {
    const { data, error } = await this.supabase
      .from('user_blocks')
      .select('*')
      .eq('blocker_user_id', blockerUserId)
      .eq('blocked_user_id', blockedUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find block between users: ${error.message}`);
    }

    return this.mapToUserBlock(data);
  }

  async isUserBlocked(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_user_id', blockerUserId)
      .eq('blocked_user_id', blockedUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false; // Not found
      throw new Error(`Failed to check if user is blocked: ${error.message}`);
    }

    return !!data;
  }

  async canUsersCommunicate(userId1: string, userId2: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('can_users_message', {
      sender_profile_id: userId1,
      recipient_profile_id: userId2
    });

    if (error) {
      throw new Error(`Failed to check communication status: ${error.message}`);
    }

    return data === true;
  }

  async getBlockedUsers(
    blockerUserId: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<UserBlock[]> {
    let query = this.supabase
      .from('user_blocks')
      .select('*')
      .eq('blocker_user_id', blockerUserId);

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get blocked users: ${error.message}`);
    }

    return data.map(item => this.mapToUserBlock(item));
  }

  async getUsersBlockingUser(
    blockedUserId: string,
    requestingUserId: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<UserBlock[]> {
    // This uses the database function to enforce authorization
    const { data, error } = await this.supabase.rpc('get_users_blocking_user', {
      blocked_user_profile_id: blockedUserId
    });

    if (error) {
      throw new Error(`Failed to get users blocking user: ${error.message}`);
    }

    // Convert the result to UserBlock entities
    const blocks = await Promise.all(
      data.map(async (item: any) => {
        const blockData = await this.supabase
          .from('user_blocks')
          .select('*')
          .eq('id', item.block_id)
          .single();

        if (blockData.error) {
          throw new Error(`Failed to fetch block details: ${blockData.error.message}`);
        }

        return this.mapToUserBlock(blockData.data);
      })
    );

    return blocks;
  }

  async getUserBlocks(
    userId: string,
    options?: {
      asBlocker?: boolean;
      asBlocked?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<UserBlock[]> {
    let query = this.supabase.from('user_blocks').select('*');

    // Build WHERE conditions
    const conditions = [];
    if (options?.asBlocker !== false) {
      conditions.push(`blocker_user_id.eq.${userId}`);
    }
    if (options?.asBlocked !== false && conditions.length === 0) {
      conditions.push(`blocked_user_id.eq.${userId}`);
    } else if (options?.asBlocked !== false) {
      query = query.or(`blocker_user_id.eq.${userId},blocked_user_id.eq.${userId}`);
    }

    if (conditions.length === 1) {
      const condition = conditions[0];
      const [field, operator, value] = condition.split('.');
      query = query.eq(field, value);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get user blocks: ${error.message}`);
    }

    return data.map(item => this.mapToUserBlock(item));
  }

  async getRecentBlocksByUser(blockerUserId: string, withinDays: number): Promise<UserBlock[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - withinDays);

    const { data, error } = await this.supabase
      .from('user_blocks')
      .select('*')
      .eq('blocker_user_id', blockerUserId)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get recent blocks: ${error.message}`);
    }

    return data.map(item => this.mapToUserBlock(item));
  }

  async getBlocksByReason(
    reason: string,
    options?: {
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<UserBlock[]> {
    let query = this.supabase
      .from('user_blocks')
      .select('*')
      .eq('reason', reason);

    if (options?.fromDate) {
      query = query.gte('created_at', options.fromDate.toISOString());
    }

    if (options?.toDate) {
      query = query.lte('created_at', options.toDate.toISOString());
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get blocks by reason: ${error.message}`);
    }

    return data.map(item => this.mapToUserBlock(item));
  }

  async countBlocksCreatedByUser(blockerUserId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_blocks')
      .select('id', { count: 'exact' })
      .eq('blocker_user_id', blockerUserId);

    if (error) {
      throw new Error(`Failed to count blocks created by user: ${error.message}`);
    }

    return count || 0;
  }

  async countBlocksReceivedByUser(blockedUserId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_blocks')
      .select('id', { count: 'exact' })
      .eq('blocked_user_id', blockedUserId);

    if (error) {
      throw new Error(`Failed to count blocks received by user: ${error.message}`);
    }

    return count || 0;
  }

  async remove(userBlock: UserBlock): Promise<void> {
    const { error } = await this.supabase
      .from('user_blocks')
      .delete()
      .eq('id', userBlock.getId());

    if (error) {
      throw new Error(`Failed to remove user block: ${error.message}`);
    }
  }

  async removeById(id: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('user_blocks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove user block: ${error.message}`);
    }

    return (count || 0) > 0;
  }

  async removeBlocksBetweenUsers(userId1: string, userId2: string): Promise<number> {
    const { error, count } = await this.supabase
      .from('user_blocks')
      .delete()
      .or(`and(blocker_user_id.eq.${userId1},blocked_user_id.eq.${userId2}),and(blocker_user_id.eq.${userId2},blocked_user_id.eq.${userId1})`);

    if (error) {
      throw new Error(`Failed to remove blocks between users: ${error.message}`);
    }

    return count || 0;
  }

  async update(userBlock: UserBlock): Promise<void> {
    const data = {
      reason: userBlock.getReasonDetails().getReason(),
      details: userBlock.getReasonDetails().getDetails(),
      updated_at: userBlock.getUpdatedAt().toISOString()
    };

    const { error } = await this.supabase
      .from('user_blocks')
      .update(data)
      .eq('id', userBlock.getId());

    if (error) {
      throw new Error(`Failed to update user block: ${error.message}`);
    }
  }

  async findExpiredBlocks(olderThanDays: number): Promise<UserBlock[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - olderThanDays);

    const { data, error } = await this.supabase
      .from('user_blocks')
      .select('*')
      .lte('created_at', expiryDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to find expired blocks: ${error.message}`);
    }

    return data.map(item => this.mapToUserBlock(item));
  }

  async hasExceededBlockingLimits(
    userId: string,
    config: {
      maxBlocksPerDay?: number;
      maxBlocksPerMonth?: number;
      maxTotalBlocks?: number;
    }
  ): Promise<boolean> {
    // Check daily limit
    if (config.maxBlocksPerDay) {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      
      const { count: dailyCount } = await this.supabase
        .from('user_blocks')
        .select('id', { count: 'exact' })
        .eq('blocker_user_id', userId)
        .gte('created_at', dayAgo.toISOString());

      if ((dailyCount || 0) >= config.maxBlocksPerDay) {
        return true;
      }
    }

    // Check monthly limit
    if (config.maxBlocksPerMonth) {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const { count: monthlyCount } = await this.supabase
        .from('user_blocks')
        .select('id', { count: 'exact' })
        .eq('blocker_user_id', userId)
        .gte('created_at', monthAgo.toISOString());

      if ((monthlyCount || 0) >= config.maxBlocksPerMonth) {
        return true;
      }
    }

    // Check total limit
    if (config.maxTotalBlocks) {
      const { count: totalCount } = await this.supabase
        .from('user_blocks')
        .select('id', { count: 'exact' })
        .eq('blocker_user_id', userId);

      if ((totalCount || 0) >= config.maxTotalBlocks) {
        return true;
      }
    }

    return false;
  }

  async getBlockingStats(options?: {
    fromDate?: Date;
    toDate?: Date;
    groupBy?: 'day' | 'week' | 'month' | 'reason';
  }): Promise<Array<{ period?: string; reason?: string; count: number; }>> {
    // This would require custom SQL queries for complex aggregations
    // For now, return basic stats
    let query = this.supabase
      .from('user_blocks')
      .select('reason, created_at', { count: 'exact' });

    if (options?.fromDate) {
      query = query.gte('created_at', options.fromDate.toISOString());
    }

    if (options?.toDate) {
      query = query.lte('created_at', options.toDate.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get blocking stats: ${error.message}`);
    }

    // Simple aggregation by reason for now
    if (options?.groupBy === 'reason') {
      const reasonCounts: { [key: string]: number } = {};
      data?.forEach(item => {
        reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
      });

      return Object.entries(reasonCounts).map(([reason, count]) => ({
        reason,
        count
      }));
    }

    return [{ count: count || 0 }];
  }

  async findMutualBlocks(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Array<{
    userId1: string;
    userId2: string;
    block1: UserBlock;
    block2: UserBlock;
  }>> {
    // This requires a complex query to find mutual blocks
    const { data, error } = await this.supabase
      .from('user_blocks')
      .select(`
        id,
        blocker_user_id,
        blocked_user_id,
        reason,
        details,
        created_at,
        updated_at
      `);

    if (error) {
      throw new Error(`Failed to find mutual blocks: ${error.message}`);
    }

    const mutualBlocks: Array<{
      userId1: string;
      userId2: string;
      block1: UserBlock;
      block2: UserBlock;
    }> = [];

    // Find pairs where both users have blocked each other
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const block1 = data[i];
        const block2 = data[j];

        if (block1.blocker_user_id === block2.blocked_user_id &&
            block1.blocked_user_id === block2.blocker_user_id) {
          mutualBlocks.push({
            userId1: block1.blocker_user_id,
            userId2: block1.blocked_user_id,
            block1: this.mapToUserBlock(block1),
            block2: this.mapToUserBlock(block2)
          });
        }
      }
    }

    return mutualBlocks;
  }

  private mapToUserBlock(data: any): UserBlock {
    const reasonDetails = new BlockReasonDetails(
      data.reason as BlockReason,
      data.details
    );

    return new UserBlock({
      id: data.id,
      blockerUserId: data.blocker_user_id,
      blockedUserId: data.blocked_user_id,
      reasonDetails,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });
  }
}