import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const MarkNSFWSchema = z.object({
  content_type: z.enum(['playground_gallery', 'media', 'enhancement_tasks']),
  content_id: z.string().uuid(),
  is_nsfw: z.boolean(),
});

// POST - Mark content as NSFW (user self-reporting)
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
    const validation = MarkNSFWSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { content_type, content_id, is_nsfw } = validation.data;

    // Call the mark_content_nsfw function
    const { data, error } = await supabase.rpc('mark_content_nsfw', {
      p_content_type: content_type,
      p_content_id: content_id,
      p_is_nsfw: is_nsfw,
    });

    if (error) {
      console.error('Error marking content as NSFW:', error);
      return NextResponse.json(
        { error: 'Failed to mark content as NSFW' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: is_nsfw ? 'Content marked as NSFW' : 'Content unmarked as NSFW',
      marked: data,
    });
  } catch (error) {
    console.error('Mark NSFW API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
