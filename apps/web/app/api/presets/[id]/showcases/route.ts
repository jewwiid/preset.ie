import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the preset to verify it exists
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select('id, name, is_public, style_settings, ai_metadata')
      .eq('id', id)
      .single();

    if (presetError || !preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    // Only show showcases for public presets
    if (!preset.is_public) {
      return NextResponse.json(
        { error: 'Preset is not public' },
        { status: 403 }
      );
    }

    // Find showcases that used this preset by looking at media metadata
    const { data: showcases, error } = await supabase
      .from('showcases')
      .select(`
        id,
        gig_id,
        creator_user_id,
        talent_user_id,
        media_ids,
        caption,
        tags,
        palette,
        visibility,
        likes_count,
        views_count,
        created_at,
        updated_at,
        users_profile!showcases_creator_user_id_fkey (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('visibility', 'PUBLIC')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching showcases:', error);
      return NextResponse.json(
        { error: 'Failed to fetch showcases' },
        { status: 500 }
      );
    }

    if (!showcases || showcases.length === 0) {
      return NextResponse.json({ showcases: [] });
    }

    // Get all media items for these showcases
    const allMediaIds = showcases.flatMap(showcase => showcase.media_ids || []);
    const uniqueMediaIds = [...new Set(allMediaIds)];

    if (uniqueMediaIds.length === 0) {
      return NextResponse.json({ showcases: [] });
    }

    const { data: mediaItems, error: mediaError } = await supabase
      .from('media')
      .select(`
        id,
        type,
        width,
        height,
        bucket,
        path,
        exif_json,
        created_at
      `)
      .in('id', uniqueMediaIds);

    if (mediaError) {
      console.error('Error fetching media items:', mediaError);
      console.error('Media IDs that failed:', uniqueMediaIds);
      return NextResponse.json(
        { error: 'Failed to fetch media items', details: mediaError.message },
        { status: 500 }
      );
    }

    // Create media map for quick lookup
    const mediaMap = new Map(mediaItems?.map(media => [media.id, media]) || []);
    

    // Filter showcases that actually used this preset
    const showcasesUsingPreset = showcases.filter(showcase => {
      const showcaseMediaIds = showcase.media_ids || [];
      const hasMatchingMedia = showcaseMediaIds.some((mediaId: string) => {
        const media = mediaMap.get(mediaId);
        if (!media) return false;
        
        // Check if this media was generated using the preset
        const presetId = media.exif_json?.preset_id || 
                        media.exif_json?.generation_metadata?.preset_id ||
                        media.exif_json?.ai_metadata?.preset_id ||
                        media.exif_json?.generation_metadata?.custom_style_preset?.id;
        
        // If no preset ID found, check if it was generated using the preset's style
        if (!presetId) {
          const styleApplied = media.exif_json?.generation_metadata?.style_applied;
          if (styleApplied) {
            // Get the preset's style to match against
            const presetStyle = preset.style_settings?.style || preset.ai_metadata?.artistic_period;
            return styleApplied === presetStyle;
          }
        }
        
        return presetId === id;
      });
      
      return hasMatchingMedia;
    });

    // Format the response
    const formattedShowcases = showcasesUsingPreset.map(showcase => {
      const showcaseMediaIds = showcase.media_ids || [];
      const showcaseMedia = showcaseMediaIds
        .map((mediaId: string) => mediaMap.get(mediaId))
        .filter((media: any) => {
          if (!media) return false;
          const presetId = media.exif_json?.preset_id || 
                          media.exif_json?.generation_metadata?.preset_id ||
                          media.exif_json?.ai_metadata?.preset_id ||
                          media.exif_json?.generation_metadata?.custom_style_preset?.id;
          
          // If no preset ID found, check if it was generated using the preset's style
          if (!presetId) {
            const styleApplied = media.exif_json?.generation_metadata?.style_applied;
            if (styleApplied) {
              // Get the preset's style to match against
              const presetStyle = preset.style_settings?.style || preset.ai_metadata?.artistic_period;
              return styleApplied === presetStyle;
            }
          }
          
          return presetId === id;
        })
        .map((media: any) => ({
          id: media.id,
          title: media.exif_json?.generation_metadata?.prompt || 'Untitled',
          type: media.type,
          width: media.width,
          height: media.height,
          url: (() => {
            if (media.bucket === 'external' || media.exif_json?.external_url) {
              // Clean up malformed URLs that might have Supabase storage path prepended
              let cleanUrl = media.path;
              if (cleanUrl.includes('supabase.co/storage/v1/object/public/playground-gallery/https://')) {
                // Extract the actual CloudFront URL from the malformed path
                const cloudfrontMatch = cleanUrl.match(/https:\/\/[^\/]+\.cloudfront\.net\/[^\s]+/);
                if (cloudfrontMatch) {
                  cleanUrl = cloudfrontMatch[0];
                }
              }
              return cleanUrl;
            }
            return `${supabaseUrl}/storage/v1/object/public/${media.bucket}/${media.path}`;
          })(),
          image_url: media.type === 'video' ? media.exif_json?.thumbnail_url : undefined,
          created_at: media.created_at
        }));

      return {
        id: showcase.id,
        title: showcase.caption || 'Untitled Showcase',
        caption: showcase.caption,
        tags: showcase.tags || [],
        palette: showcase.palette,
        visibility: showcase.visibility,
        likes_count: showcase.likes_count || 0,
        views_count: showcase.views_count || 0,
        media: showcaseMedia,
        media_count: showcaseMedia.length,
        creator: {
          id: showcase.users_profile?.[0]?.id,
          display_name: showcase.users_profile?.[0]?.display_name || 'Unknown',
          handle: showcase.users_profile?.[0]?.handle || 'unknown',
          avatar_url: showcase.users_profile?.[0]?.avatar_url
        },
        created_at: showcase.created_at,
        updated_at: showcase.updated_at
      };
    });

    return NextResponse.json({ 
      showcases: formattedShowcases,
      total: formattedShowcases.length,
      preset: {
        id: preset.id,
        name: preset.name
      }
    });

  } catch (error) {
    console.error('Error in preset showcases API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
