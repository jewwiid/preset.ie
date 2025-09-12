import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { SupabaseMessageReportRepository } from '@preset/adapters/reports/SupabaseMessageReportRepository';

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

    // Create report repository
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const reportRepository = new SupabaseMessageReportRepository(supabaseUrl, supabaseServiceKey);

    // Fetch message reports
    const reports = await reportRepository.getMessageReports(filters);

    // Get statistics
    const stats = await reportRepository.getReportStats();

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

    // Create report repository
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const reportRepository = new SupabaseMessageReportRepository(supabaseUrl, supabaseServiceKey);

    // Resolve the report
    const success = await reportRepository.resolveReport(reportId, user.id, action, notes);

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