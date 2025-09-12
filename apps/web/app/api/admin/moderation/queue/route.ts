import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const GetModerationQueueSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'approved', 'rejected', 'escalated']).optional(),
  severityMin: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
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
    
    const validation = GetModerationQueueSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const filters = validation.data;

    // Build query for moderation queue
    let query = supabase
      .from('content_moderation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.severityMin) {
      query = query.gte('severity_score', filters.severityMin);
    }

    const { data: queueItems, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch moderation queue' }, { status: 500 });
    }

    // Get basic statistics
    const { data: stats } = await supabase
      .from('content_moderation_queue')
      .select('status')
      .then(({ data }: any) => {
        const counts = data?.reduce((acc: any, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        return {
          data: {
            pending: counts.pending || 0,
            reviewing: counts.reviewing || 0,
            approved: counts.approved || 0,
            rejected: counts.rejected || 0,
            escalated: counts.escalated || 0,
            total: data?.length || 0
          }
        };
      });

    return NextResponse.json({
      items: queueItems,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: queueItems.length === filters.limit
      },
      stats
    });

  } catch (error) {
    console.error('Failed to fetch moderation queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch resolve items schema
const BatchResolveSchema = z.object({
  items: z.array(z.object({
    queueId: z.string().uuid(),
    status: z.enum(['approved', 'rejected', 'escalated']),
    notes: z.string().optional()
  })).min(1).max(50)
});

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
    const validation = BatchResolveSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { items } = validation.data;

    // Batch resolve items directly
    const updates = items.map(item => ({
      id: item.queueId,
      status: item.status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      admin_notes: item.notes
    }));

    const { error: updateError } = await supabase
      .from('content_moderation_queue')
      .upsert(updates);

    const resolvedCount = updateError ? 0 : items.length;

    return NextResponse.json({
      success: true,
      resolvedCount,
      totalRequested: items.length
    });

  } catch (error) {
    console.error('Failed to batch resolve moderation items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}