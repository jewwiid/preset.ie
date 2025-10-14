import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Track preset usage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: presetId } = await params;
    const body = await request.json();
    const {
      num_images_generated,
      aspect_ratio_used,
      provider_used,
      success = true,
    } = body;

    // Insert usage record
    const { error: usageError } = await supabase
      .from('stitch_preset_usage')
      .insert({
        preset_id: presetId,
        user_id: user.id,
        num_images_generated: num_images_generated || null,
        aspect_ratio_used: aspect_ratio_used || null,
        provider_used: provider_used || null,
        success,
      });

    if (usageError) {
      console.error('Error tracking preset usage:', usageError);
      // Don't fail the request if tracking fails, just log it
    }

    // Increment preset usage count using the stored function
    const { error: incrementError } = await supabase.rpc('increment_preset_usage', {
      preset_id: presetId,
    });

    if (incrementError) {
      console.error('Error incrementing preset usage:', incrementError);
      // Don't fail the request if increment fails, just log it
    }

    return NextResponse.json({ message: 'Preset usage tracked successfully' });
  } catch (error) {
    console.error('Track preset usage error:', error);
    // Return success even if tracking fails - it's not critical
    return NextResponse.json({ message: 'Request processed' });
  }
}

