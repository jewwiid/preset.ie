import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Showcase API route loaded

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showcaseId } = await params;
    console.log('API ROUTE HIT - Fetching showcase:', showcaseId);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Fetch the showcase with all related data
    const { data: showcase, error: showcaseError } = await supabase
      .from('showcases')
      .select(`
        *,
        creator:users_profile!showcases_creator_user_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        talent:users_profile!showcases_talent_user_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        showcase_likes(user_id)
      `)
      .eq('id', showcaseId)
      .single();

    if (showcaseError || !showcase) {
      console.error('Error fetching showcase:', showcaseError);
      return NextResponse.json({ error: 'Showcase not found' }, { status: 404 });
    }

    // Fetch media items using the media_ids array
    let mediaItems: any[] = [];
    if (showcase.media_ids && showcase.media_ids.length > 0) {
      // Use service key for media fetching to bypass RLS
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: media, error: mediaError } = await supabaseAdmin
        .from('media')
        .select('id, path, bucket, type, width, height, exif_json')
        .in('id', showcase.media_ids);

      if (mediaError) {
        console.error('Error fetching media:', mediaError);
      } else {
        mediaItems = media || [];
      }
    }

    // Format the response
    const formattedShowcase = {
      id: showcase.id,
      title: showcase.caption || 'Untitled Showcase',
      caption: showcase.caption,
      description: showcase.caption,
      type: showcase.type || 'individual',
      media_ids: showcase.media_ids,
      media: mediaItems.map((media: any) => ({
        id: media.id,
        url: media.bucket === 'external' || media.exif_json?.external_url 
          ? media.path 
          : `${supabaseUrl}/storage/v1/object/public/${media.bucket}/${media.path}`,
        type: media.type,
        thumbnail_url: media.thumbnail_url,
        width: media.width,
        height: media.height,
        exif_json: media.exif_json
      })),
      media_count: mediaItems.length,
      tags: showcase.tags || [],
      palette: showcase.palette,
      visibility: showcase.visibility,
      likes_count: showcase.showcase_likes.length,
      views_count: showcase.views_count || 0,
      creator: {
        id: showcase.creator?.id,
        display_name: showcase.creator?.display_name || 'Unknown',
        handle: showcase.creator?.handle || 'unknown',
        avatar_url: showcase.creator?.avatar_url,
        verified_id: showcase.creator?.verified_id
      },
      talent: showcase.talent ? {
        id: showcase.talent.id,
        display_name: showcase.talent.display_name || 'Unknown',
        handle: showcase.talent.handle || 'unknown',
        avatar_url: showcase.talent.avatar_url,
        verified_id: showcase.talent.verified_id
      } : null,
      created_at: showcase.created_at,
      updated_at: showcase.updated_at,
      moodboard_summary: showcase.moodboard_summary,
      moodboard_palette: showcase.moodboard_palette
    };

    return NextResponse.json({ showcase: formattedShowcase });

  } catch (error) {
    console.error('Error in showcase GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
