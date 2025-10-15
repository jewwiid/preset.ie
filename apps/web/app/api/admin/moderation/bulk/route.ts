import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BulkActionSchema = z.object({
  queueIds: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approved', 'rejected', 'escalated']),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
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
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = BulkActionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { queueIds, action, notes } = validation.data;

    // Start transaction
    const { data: queueItems, error: fetchError } = await supabase
      .from('content_moderation_queue')
      .select('id, content_id, content_type, user_id')
      .in('id', queueIds)
      .in('status', ['pending', 'reviewing', 'escalated']);

    if (fetchError) {
      console.error('Error fetching queue items:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch queue items' }, { status: 500 });
    }

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ error: 'No valid items found to process' }, { status: 400 });
    }

    // Update moderation queue items
    const { error: updateError } = await supabase
      .from('content_moderation_queue')
      .update({
        status: action,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .in('id', queueItems.map((item: any) => item.id));

    if (updateError) {
      console.error('Error updating moderation queue:', updateError);
      return NextResponse.json({ error: 'Failed to update moderation queue' }, { status: 500 });
    }

    // Handle side effects based on action
    if (action === 'rejected') {
      // Delete flagged content for rejected items
      const messageIds = queueItems
        .filter((item: any) => item.content_type === 'message')
        .map((item: any) => item.content_id);

      if (messageIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('messages')
          .update({ 
            deleted_at: new Date().toISOString(),
            body: '[Content removed by moderation]'
          })
          .in('id', messageIds);

        if (deleteError) {
          console.error('Error deleting flagged messages:', deleteError);
          // Don't fail the entire operation for this
        }
      }

      // Handle other content types as needed
      // TODO: Add handling for gigs, showcases, profiles, images
    }

    // Log moderation actions
    const moderationActions = queueItems.map((item: any) => ({
      admin_user_id: user.id,
      target_user_id: item.user_id,
      action_type: `bulk_${action}`,
      reason: `Bulk moderation: ${action}`,
      notes: notes,
      content_type: item.content_type,
      content_id: item.content_id
    }));

    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert(moderationActions);

    if (logError) {
      console.error('Error logging moderation actions:', logError);
      // Don't fail the operation for logging errors
    }

    // Update user violations for rejected content
    if (action === 'rejected') {
      const userViolations = queueItems.map((item: any) => ({
        user_id: item.user_id,
        violation_type: 'content_violation',
        severity: 'medium',
        description: `Content ${action} by admin bulk action`,
        source: 'admin_moderation'
      }));

      const { error: violationError } = await supabase
        .from('user_violations')
        .insert(userViolations);

      if (violationError) {
        console.error('Error creating user violations:', violationError);
        // Don't fail the operation for violation logging
      }
    }

    return NextResponse.json({
      success: true,
      processed: queueItems.length,
      requested: queueIds.length,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}