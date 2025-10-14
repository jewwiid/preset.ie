import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Like a preset
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

    // Check if preset exists and is accessible
    const { data: preset, error: presetError } = await supabase
      .from('stitch_presets')
      .select('id, user_id, is_public')
      .eq('id', presetId)
      .single();

    if (presetError || !preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    // Can't like your own preset
    if (preset.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot like your own preset' },
        { status: 400 }
      );
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('stitch_preset_likes')
      .select('user_id')
      .eq('preset_id', presetId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this preset' },
        { status: 400 }
      );
    }

    // Insert like (trigger will auto-increment likes_count)
    const { error } = await supabase
      .from('stitch_preset_likes')
      .insert({
        preset_id: presetId,
        user_id: user.id,
      });

    if (error) {
      console.error('Error liking preset:', error);
      return NextResponse.json(
        { error: 'Failed to like preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Preset liked successfully' });
  } catch (error) {
    console.error('Like preset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Unlike a preset
export async function DELETE(
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

    // Delete like (trigger will auto-decrement likes_count)
    const { error } = await supabase
      .from('stitch_preset_likes')
      .delete()
      .eq('preset_id', presetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error unliking preset:', error);
      return NextResponse.json(
        { error: 'Failed to unlike preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Preset unliked successfully' });
  } catch (error) {
    console.error('Unlike preset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

