import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * PATCH /api/showcase-media/[id]
 * Update showcase media title and description
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await params;
    const body = await request.json();
    const { title, description } = body;

    console.log('📝 Updating showcase media:', { mediaId, title, description });

    // Validate
    if (title === undefined && description === undefined) {
      return NextResponse.json(
        { error: 'At least one field (title or description) is required' },
        { status: 400 }
      );
    }

    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('👤 User authenticated:', user.id);

    // Get showcase media to verify ownership
    const { data: showcaseMedia, error: fetchError } = await supabaseAdmin
      .from('showcase_media')
      .select(`
        id,
        showcase_id,
        title,
        description,
        showcases!inner(
          id,
          creator_user_id
        )
      `)
      .eq('id', mediaId)
      .single();

    if (fetchError || !showcaseMedia) {
      console.error('❌ Showcase media not found:', fetchError);
      return NextResponse.json(
        { error: 'Showcase media not found' },
        { status: 404 }
      );
    }

    console.log('📦 Found showcase media:', showcaseMedia);

    // Check ownership (showcases is typed as array but will be single object due to inner join)
    const showcase = Array.isArray(showcaseMedia.showcases) ? showcaseMedia.showcases[0] : showcaseMedia.showcases;
    if (showcase.creator_user_id !== user.id) {
      console.error('❌ Permission denied:', {
        userId: user.id,
        creatorId: showcase.creator_user_id,
      });
      return NextResponse.json(
        { error: 'You do not have permission to edit this image' },
        { status: 403 }
      );
    }

    // Update metadata
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();

    console.log('💾 Updating with data:', updateData);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('showcase_media')
      .update(updateData)
      .eq('id', mediaId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating showcase media:', updateError);
      return NextResponse.json(
        { error: 'Failed to update image metadata' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully updated showcase media:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Image metadata updated successfully',
    });
  } catch (error) {
    console.error('❌ Error in showcase-media PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/showcase-media/[id]
 * Get showcase media details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await params;

    const { data, error } = await supabaseAdmin
      .from('showcase_media')
      .select(`
        *,
        showcases!inner(
          id,
          caption,
          creator_user_id,
          users_profile!inner(
            display_name,
            handle
          )
        )
      `)
      .eq('id', mediaId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Showcase media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in showcase-media GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
