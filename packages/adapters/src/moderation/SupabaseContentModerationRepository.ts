import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ContentModerationRepository,
  ModerationQueueItem,
  UserModerationStats
} from '../../../application/src/collaboration/services/ContentModerationService';

export class SupabaseContentModerationRepository implements ContentModerationRepository {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async queueForModeration(item: {
    contentId: string;
    contentType: string;
    contentText: string;
    userId: string;
    flaggedReasons: string[];
    severityScore: number;
  }): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('queue_for_moderation', {
        p_content_id: item.contentId,
        p_content_type: item.contentType,
        p_content_text: item.contentText,
        p_user_id: item.userId
      })
      .single();

    if (error) {
      console.error('Failed to queue content for moderation:', error);
      throw new Error(`Failed to queue content for moderation: ${error.message}`);
    }

    return data;
  }

  async resolveItem(
    queueId: string,
    reviewerId: string,
    status: string,
    notes?: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('resolve_moderation_item', {
        p_queue_id: queueId,
        p_reviewer_id: reviewerId,
        p_status: status,
        p_resolution_notes: notes || null
      })
      .single();

    if (error) {
      console.error('Failed to resolve moderation item:', error);
      throw new Error(`Failed to resolve moderation item: ${error.message}`);
    }

    return data;
  }

  async getModerationQueue(filters?: {
    status?: string;
    severityMin?: number;
    limit?: number;
    offset?: number;
  }): Promise<ModerationQueueItem[]> {
    let query = this.supabase
      .from('admin_moderation_dashboard')
      .select(`
        id,
        content_id,
        content_type,
        content_text,
        user_id,
        flagged_reason,
        severity_score,
        status,
        reviewer_id,
        auto_flagged_at,
        reviewed_at,
        resolution_notes,
        metadata,
        user_name,
        user_handle,
        reviewer_name,
        user_stats
      `)
      .order('severity_score', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.severityMin) {
      query = query.gte('severity_score', filters.severityMin);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch moderation queue:', error);
      throw new Error(`Failed to fetch moderation queue: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      contentId: item.content_id,
      contentType: item.content_type,
      contentText: item.content_text,
      userId: item.user_id,
      flaggedReasons: item.flagged_reason || [],
      severityScore: item.severity_score,
      status: item.status,
      reviewerId: item.reviewer_id,
      autoFlaggedAt: new Date(item.auto_flagged_at),
      reviewedAt: item.reviewed_at ? new Date(item.reviewed_at) : undefined,
      resolutionNotes: item.resolution_notes,
      metadata: item.metadata || {}
    }));
  }

  async getUserModerationStats(userId: string): Promise<UserModerationStats> {
    const { data, error } = await this.supabase
      .rpc('get_user_moderation_stats', {
        p_user_id: userId
      })
      .single();

    if (error) {
      console.error('Failed to get user moderation stats:', error);
      // Return default stats on error to avoid blocking operations
      return {
        totalFlagged: 0,
        flaggedLast30Days: 0,
        resolvedViolations: 0,
        currentRiskScore: 0
      };
    }

    return {
      totalFlagged: data.total_flagged || 0,
      flaggedLast30Days: data.flagged_last_30_days || 0,
      resolvedViolations: data.resolved_violations || 0,
      currentRiskScore: data.current_risk_score || 0
    };
  }

  // Helper method to check content before sending
  async checkContent(
    contentId: string,
    contentType: string,
    contentText: string,
    userId: string
  ): Promise<{
    shouldFlag: boolean;
    flaggedReasons: string[];
    severityScore: number;
  }> {
    const { data, error } = await this.supabase
      .rpc('check_content_moderation', {
        p_content_id: contentId,
        p_content_type: contentType,
        p_content_text: contentText,
        p_user_id: userId
      })
      .single();

    if (error) {
      console.error('Failed to check content moderation:', error);
      // Return safe defaults on error
      return {
        shouldFlag: false,
        flaggedReasons: [],
        severityScore: 0
      };
    }

    return {
      shouldFlag: data.should_flag || false,
      flaggedReasons: data.flagged_reasons || [],
      severityScore: data.severity_score || 0
    };
  }

  // Batch operations for admin efficiency
  async batchResolveItems(
    items: Array<{
      queueId: string;
      status: string;
      notes?: string;
    }>,
    reviewerId: string
  ): Promise<number> {
    let resolvedCount = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const promises = batch.map(item => 
        this.resolveItem(item.queueId, reviewerId, item.status, item.notes)
      );

      try {
        const results = await Promise.all(promises);
        resolvedCount += results.filter(Boolean).length;
      } catch (error) {
        console.error('Batch resolve failed for some items:', error);
        // Continue processing other batches
      }

      // Small delay between batches to be respectful to the database
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return resolvedCount;
  }

  // Get moderation statistics for admin dashboard
  async getModerationStats(): Promise<{
    pendingCount: number;
    reviewingCount: number;
    resolvedToday: number;
    averageResolutionTime: number;
    topViolationReasons: Array<{ reason: string; count: number }>;
  }> {
    try {
      // Get counts by status
      const { data: statusCounts, error: statusError } = await this.supabase
        .from('moderation_queue')
        .select('status')
        .in('status', ['pending', 'reviewing']);

      if (statusError) throw statusError;

      const pendingCount = statusCounts?.filter(item => item.status === 'pending').length || 0;
      const reviewingCount = statusCounts?.filter(item => item.status === 'reviewing').length || 0;

      // Get resolved today count
      const today = new Date().toISOString().split('T')[0];
      const { count: resolvedToday, error: resolvedError } = await this.supabase
        .from('moderation_queue')
        .select('*', { count: 'exact' })
        .eq('status', 'resolved')
        .gte('reviewed_at', today);

      if (resolvedError) throw resolvedError;

      // Calculate average resolution time (simplified)
      const { data: resolvedItems, error: avgError } = await this.supabase
        .from('moderation_queue')
        .select('auto_flagged_at, reviewed_at')
        .eq('status', 'resolved')
        .not('reviewed_at', 'is', null)
        .gte('reviewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .limit(100);

      if (avgError) throw avgError;

      let averageResolutionTime = 0;
      if (resolvedItems && resolvedItems.length > 0) {
        const totalTime = resolvedItems.reduce((sum, item) => {
          const flaggedTime = new Date(item.auto_flagged_at).getTime();
          const reviewedTime = new Date(item.reviewed_at).getTime();
          return sum + (reviewedTime - flaggedTime);
        }, 0);
        averageResolutionTime = totalTime / resolvedItems.length / (1000 * 60 * 60); // Convert to hours
      }

      // Get top violation reasons (simplified)
      const { data: violations, error: violationsError } = await this.supabase
        .from('moderation_queue')
        .select('flagged_reason')
        .not('flagged_reason', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (violationsError) throw violationsError;

      const reasonCounts: Record<string, number> = {};
      violations?.forEach(item => {
        if (item.flagged_reason && Array.isArray(item.flagged_reason)) {
          item.flagged_reason.forEach((reason: string) => {
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          });
        }
      });

      const topViolationReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        pendingCount,
        reviewingCount,
        resolvedToday: resolvedToday || 0,
        averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
        topViolationReasons
      };
    } catch (error) {
      console.error('Failed to get moderation stats:', error);
      return {
        pendingCount: 0,
        reviewingCount: 0,
        resolvedToday: 0,
        averageResolutionTime: 0,
        topViolationReasons: []
      };
    }
  }
}