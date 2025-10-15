import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const SanctionSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['warning', 'suspension', 'ban']),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  duration: z.number().optional(), // hours for suspension
  notes: z.string().optional(),
  notifyUser: z.boolean().default(true)
});

const GetSanctionsSchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum(['warning', 'suspension', 'ban']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
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
    const validation = SanctionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { userId, type, reason, duration, notes, notifyUser } = validation.data;

    // Check if user exists
    const { data: targetUser } = await supabase
      .from('users_profile')
      .select('user_id, display_name, handle, email')
      .eq('user_id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare profile updates based on sanction type
    const profileUpdates: any = {};
    const sanctionEndTime = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;
    
    switch (type) {
      case 'warning':
        // Warnings don't change profile status, just log the action
        break;
      case 'suspension':
        profileUpdates.suspended_until = sanctionEndTime?.toISOString();
        profileUpdates.suspension_reason = reason;
        break;
      case 'ban':
        profileUpdates.banned_at = new Date().toISOString();
        profileUpdates.ban_reason = reason;
        profileUpdates.suspended_until = null; // Clear any existing suspension
        break;
    }

    // Update user profile if needed
    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('users_profile')
        .update(profileUpdates)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return NextResponse.json({ error: 'Failed to apply sanction' }, { status: 500 });
      }
    }

    // Log moderation action
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        admin_user_id: user.id,
        target_user_id: userId,
        action_type: type,
        reason,
        notes,
        duration_hours: duration,
        expires_at: sanctionEndTime?.toISOString()
      });

    if (logError) {
      console.error('Error logging moderation action:', logError);
      // Don't fail the operation for logging errors
    }

    // Create user violation record
    const violationSeverity = type === 'ban' ? 'high' : type === 'suspension' ? 'medium' : 'low';
    const { error: violationError } = await supabase
      .from('user_violations')
      .insert({
        user_id: userId,
        violation_type: type,
        severity: violationSeverity,
        description: reason,
        source: 'admin_sanction'
      });

    if (violationError) {
      console.error('Error creating user violation:', violationError);
      // Don't fail the operation for violation logging
    }

    // TODO: Send notification to user if requested
    if (notifyUser) {
      // This would integrate with your notification system
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'moderation_action',
            title: `Account ${type}`,
            message: `Your account has received a ${type}. Reason: ${reason}`,
            metadata: {
              sanction_type: type,
              reason,
              duration_hours: duration,
              expires_at: sanctionEndTime?.toISOString(),
              admin_id: user.id
            }
          });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the operation for notification errors
      }
    }

    // Prepare response
    const response: any = {
      success: true,
      sanction: {
        type,
        reason,
        applied_at: new Date().toISOString(),
        applied_by: user.id,
        target_user: {
          id: userId,
          display_name: targetUser.display_name,
          handle: targetUser.handle
        }
      }
    };

    if (duration) {
      response.sanction.duration_hours = duration;
      response.sanction.expires_at = sanctionEndTime?.toISOString();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('User sanction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validation = GetSanctionsSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { userId, type, limit, offset } = validation.data;

    // Build query
    let query = supabase
      .from('moderation_actions')
      .select(`
        id,
        action_type,
        reason,
        notes,
        duration_hours,
        expires_at,
        created_at,
        admin_user_id,
        target_user_id,
        admin:users_profile!admin_user_id(display_name, handle),
        target_user:users_profile!target_user_id(display_name, handle)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq('target_user_id', userId);
    }
    if (type) {
      query = query.eq('action_type', type);
    }

    const { data: sanctions, error: sanctionsError } = await query;

    if (sanctionsError) {
      console.error('Error fetching sanctions:', sanctionsError);
      return NextResponse.json({ error: 'Failed to fetch sanctions' }, { status: 500 });
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('moderation_actions')
      .select('action_type')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const summary = {
      total: sanctions?.length || 0,
      last_30_days: {
        warnings: stats?.filter((s: any) => s.action_type === 'warning').length || 0,
        suspensions: stats?.filter((s: any) => s.action_type === 'suspension').length || 0,
        bans: stats?.filter((s: any) => s.action_type === 'ban').length || 0
      }
    };

    return NextResponse.json({
      sanctions: sanctions || [],
      summary,
      pagination: {
        offset,
        limit,
        hasMore: sanctions?.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching sanctions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}