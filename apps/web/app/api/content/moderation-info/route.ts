import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const ModerationInfoSchema = z.object({
  content_type: z.enum(['playground_gallery', 'media', 'enhancement_tasks', 'user_type', 'suggested_type']),
  content_id: z.string().uuid(),
});

// GET - Get moderation information for content
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const content_type = searchParams.get('content_type');
    const content_id = searchParams.get('content_id');

    const validation = ModerationInfoSchema.safeParse({
      content_type,
      content_id,
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { content_type: validated_content_type, content_id: validated_content_id } = validation.data;

    // Call the get_content_moderation_info function
    const { data, error } = await supabase.rpc('get_content_moderation_info', {
      p_content_type: validated_content_type,
      p_content_id: validated_content_id,
    });

    if (error) {
      console.error('Error getting moderation info:', error);
      return NextResponse.json(
        { error: 'Failed to get moderation information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      moderation_info: data,
    });
  } catch (error) {
    console.error('Get moderation info API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
