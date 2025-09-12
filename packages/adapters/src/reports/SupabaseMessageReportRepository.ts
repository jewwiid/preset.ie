import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageReportRepository } from '../../../application/src/collaboration/use-cases/ReportMessage';

export class SupabaseMessageReportRepository implements MessageReportRepository {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async submitReport(report: {
    id: string;
    reporterId: string;
    messageId: string;
    reason: string;
    description: string;
    evidenceUrls?: string[];
    priority: string;
  }): Promise<void> {
    try {
      // First, get the message details to find the reported user
      const { data: messageData, error: messageError } = await this.supabase
        .from('messages')
        .select('from_user_id, gig_id, to_user_id')
        .eq('id', report.messageId)
        .single();

      if (messageError || !messageData) {
        console.error('Failed to find message for report:', messageError);
        throw new Error('Message not found');
      }

      // Insert the report into the reports table
      const { error: insertError } = await this.supabase
        .from('reports')
        .insert({
          id: report.id,
          reporter_user_id: report.reporterId,
          reported_user_id: messageData.from_user_id, // The sender of the message
          reported_content_id: report.messageId,
          content_type: 'message',
          reason: report.reason,
          description: report.description,
          evidence_urls: report.evidenceUrls || [],
          priority: report.priority,
          status: 'pending'
        });

      if (insertError) {
        console.error('Failed to submit message report:', insertError);
        throw new Error(`Failed to submit report: ${insertError.message}`);
      }

    } catch (error) {
      console.error('Error in submitReport:', error);
      throw error instanceof Error ? error : new Error('Failed to submit report');
    }
  }

  async getExistingReport(reporterId: string, messageId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('reports')
        .select('id')
        .eq('reporter_user_id', reporterId)
        .eq('reported_content_id', messageId)
        .eq('content_type', 'message')
        .maybeSingle();

      if (error) {
        console.error('Failed to check existing report:', error);
        return null; // Return null on error to allow the report to proceed
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in getExistingReport:', error);
      return null; // Return null on error to allow the report to proceed
    }
  }

  // Additional helper methods for admin functionality

  async getMessageReports(filters?: {
    status?: string;
    priority?: string;
    reportedUserId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<{
    id: string;
    reporterId: string;
    reporterName?: string;
    reportedUserId: string;
    reportedUserName?: string;
    messageId: string;
    messageContent?: string;
    reason: string;
    description: string;
    priority: string;
    status: string;
    createdAt: Date;
    evidenceUrls: string[];
  }>> {
    try {
      let query = this.supabase
        .from('admin_reports_dashboard')
        .select(`
          id,
          reporter_user_id,
          reporter_name,
          reporter_handle,
          reported_user_id,
          reported_name,
          reported_handle,
          reported_content_id,
          reason,
          description,
          priority,
          status,
          evidence_urls,
          created_at
        `)
        .eq('content_type', 'message')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.reportedUserId) {
        query = query.eq('reported_user_id', filters.reportedUserId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch message reports:', error);
        throw new Error(`Failed to fetch reports: ${error.message}`);
      }

      return (data || []).map(item => ({
        id: item.id,
        reporterId: item.reporter_user_id,
        reporterName: item.reporter_name,
        reportedUserId: item.reported_user_id,
        reportedUserName: item.reported_name,
        messageId: item.reported_content_id,
        reason: item.reason,
        description: item.description,
        priority: item.priority,
        status: item.status,
        createdAt: new Date(item.created_at),
        evidenceUrls: item.evidence_urls || []
      }));
    } catch (error) {
      console.error('Error in getMessageReports:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch message reports');
    }
  }

  async resolveReport(
    reportId: string,
    resolverId: string,
    action: 'warning' | 'content_removed' | 'user_suspended' | 'user_banned' | 'dismissed' | 'no_action',
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolved_by: resolverId,
          resolved_at: new Date().toISOString(),
          resolution_action: action,
          resolution_notes: notes
        })
        .eq('id', reportId);

      if (error) {
        console.error('Failed to resolve report:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resolveReport:', error);
      return false;
    }
  }

  async getReportStats(): Promise<{
    totalReports: number;
    pendingReports: number;
    resolvedToday: number;
    topReasons: Array<{ reason: string; count: number }>;
  }> {
    try {
      // Get total message reports
      const { count: totalCount } = await this.supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', 'message');

      // Get pending message reports
      const { count: pendingCount } = await this.supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', 'message')
        .eq('status', 'pending');

      // Get resolved today
      const today = new Date().toISOString().split('T')[0];
      const { count: resolvedToday } = await this.supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', 'message')
        .eq('status', 'resolved')
        .gte('resolved_at', today);

      // Get top reasons (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: reasonData } = await this.supabase
        .from('reports')
        .select('reason')
        .eq('content_type', 'message')
        .gte('created_at', thirtyDaysAgo);

      // Count reasons
      const reasonCounts: Record<string, number> = {};
      reasonData?.forEach(item => {
        reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
      });

      const topReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalReports: totalCount || 0,
        pendingReports: pendingCount || 0,
        resolvedToday: resolvedToday || 0,
        topReasons
      };
    } catch (error) {
      console.error('Error in getReportStats:', error);
      return {
        totalReports: 0,
        pendingReports: 0,
        resolvedToday: 0,
        topReasons: []
      };
    }
  }
}