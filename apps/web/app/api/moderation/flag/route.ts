import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Flag content for moderation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content_type,
      content_id,
      reason,
      details,
    } = body;

    // Validate input
    if (!content_type || !['user_type', 'suggested_type', 'image', 'generation'].includes(content_type)) {
      return NextResponse.json(
        { error: 'Invalid content_type' },
        { status: 400 }
      );
    }

    if (!content_id) {
      return NextResponse.json(
        { error: 'content_id is required' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    // Log the flag action
    const { data: logData, error: logError } = await supabase
      .from('content_moderation_log')
      .insert({
        content_type,
        content_id,
        user_id: user.id,
        action: 'flag',
        reason: reason.trim(),
        details: details || null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging flag action:', logError);
      return NextResponse.json(
        { error: 'Failed to log flag action' },
        { status: 500 }
      );
    }

    // Update the content item to mark it as flagged
    let updateError = null;
    
    if (content_type === 'user_type') {
      const { error } = await supabase
        .from('user_image_type_library')
        .update({
          is_flagged: true,
          moderation_status: 'flagged',
          moderation_reason: reason.trim(),
        })
        .eq('id', content_id)
        .eq('user_id', user.id); // Ensure user can only flag their own content

      updateError = error;
    } else if (content_type === 'suggested_type') {
      const { error } = await supabase
        .from('suggested_image_types')
        .update({
          is_flagged: true,
          moderation_status: 'flagged',
          moderation_reason: reason.trim(),
        })
        .eq('id', content_id)
        .eq('user_id', user.id); // Ensure user can only flag their own content

      updateError = error;
    }

    if (updateError) {
      console.error('Error updating flagged content:', updateError);
      return NextResponse.json(
        { error: 'Failed to flag content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content flagged successfully',
      log_id: logData.id,
    });
  } catch (error) {
    console.error('Flag content API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
