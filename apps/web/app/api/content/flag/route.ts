import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const FlagContentSchema = z.object({
  content_type: z.enum(['playground_gallery', 'media', 'enhancement_tasks', 'user_type', 'suggested_type']),
  content_id: z.string().uuid(),
  flag_type: z.enum(['nsfw', 'inappropriate', 'spam', 'copyright', 'violence', 'hate_speech', 'other']),
  reason: z.string().min(1).max(500),
  description: z.string().max(1000).optional(),
});

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
    const validation = FlagContentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { content_type, content_id, flag_type, reason, description } = validation.data;

    // Call the flag_content function
    const { data, error } = await supabase.rpc('flag_content', {
      p_content_type: content_type,
      p_content_id: content_id,
      p_flag_type: flag_type,
      p_reason: reason,
      p_description: description,
    });

    if (error) {
      console.error('Error flagging content:', error);
      return NextResponse.json(
        { error: 'Failed to flag content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content flagged successfully',
      flagged: data,
    });
  } catch (error) {
    console.error('Flag content API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
