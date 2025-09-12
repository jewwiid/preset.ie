import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const GetMessageReportsSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'resolved', 'dismissed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  reportedUserId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

const ResolveReportSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(['warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed', 'no_action']),
  notes: z.string().min(1).max(1000).optional()
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single();

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validation = GetMessageReportsSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const filters = validation.data;

    // Build query for message reports
    let query = supabase
      .from('message_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.reportedUserId) {
      query = query.eq('reported_user_id', filters.reportedUserId);
    }

    const { data: reports, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch message reports' }, { status: 500 });
    }

    // Get basic statistics
    const { data: statsData } = await supabase
      .from('message_reports')
      .select('status')
      .then(({ data }: { data: { status: string }[] | null }) => {
        const counts = data?.reduce((acc: Record<string, number>, item: { status: string }) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        return {
          data: {
            pending: counts.pending || 0,
            reviewing: counts.reviewing || 0,
            resolved: counts.resolved || 0,
            dismissed: counts.dismissed || 0,
            total: data?.length || 0
          }
        };
      });

    const stats = statsData;

    return NextResponse.json({
      reports,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: reports.length === filters.limit
      },
      stats
    });

  } catch (error) {
    console.error('Failed to fetch message reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single();

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const validation = ResolveReportSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { reportId, action, notes } = validation.data;

    // Update report directly
    const { error: updateError } = await supabase
      .from('message_reports')
      .update({
        status: action,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('id', reportId)
      .eq('status', 'pending');

    const success = !updateError;

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to resolve report. Report may not exist or already be resolved.' },
        { status: 404 }
      );
    }

    // If content removal is selected, we might want to hide/delete the message
    // This would require additional implementation in the message repository
    if (action === 'content_removed') {
      // TODO: Implement message deletion/hiding
      // await messageRepository.hideMessage(reportedContentId, user.id, 'Removed due to report');
      console.log(`Content removal requested for report ${reportId} - implementation pending`);
    }

    return NextResponse.json({
      success: true,
      reportId,
      action,
      resolvedBy: user.id,
      resolvedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to resolve message report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}