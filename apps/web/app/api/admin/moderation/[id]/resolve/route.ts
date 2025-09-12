import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const ResolveModerationSchema = z.object({
  status: z.enum(['approved', 'rejected', 'escalated']),
  notes: z.string().min(1).max(1000).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate moderation queue ID
    const resolvedParams = await params;
    const queueId = resolvedParams.id;
    if (!queueId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queueId)) {
      return NextResponse.json({ error: 'Invalid moderation queue ID' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const validation = ResolveModerationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { status, notes } = validation.data;

    // Update moderation queue item directly
    const { error: updateError } = await supabase
      .from('content_moderation_queue')
      .update({
        status,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('id', queueId)
      .eq('status', 'pending');

    const success = !updateError;

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to resolve moderation item. Item may not exist or already be resolved.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      queueId,
      status,
      resolvedBy: user.id,
      resolvedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to resolve moderation item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}