import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    // Fetch recent AI-generated images and videos from playground_gallery
    // Filter to only show items with generation_metadata (AI-generated content)
    const { data: images, error: imagesError } = await supabase
      .from('playground_gallery')
      .select('id, image_url, thumbnail_url, video_url, media_type, title, description, tags, user_id, created_at, generation_metadata, width, height')
      .not('generation_metadata', 'is', null)
      .not('generation_metadata', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (imagesError) {
      console.error('Error fetching preset images:', imagesError);
      return NextResponse.json({ error: 'Failed to fetch preset images', details: imagesError }, { status: 500 });
    }

    
    if (!images || images.length === 0) {
      console.log('No playground_gallery images found, falling back to platform_images');

      // Fallback to platform_images if no user-generated content
      const { data: platformImages, error: platformError } = await supabase
        .from('platform_images')
        .select('id, image_url, title, alt_text, category')
        .not('image_url', 'is', null)
        .limit(parseInt(limit));

      if (platformError) {
        console.error('Error fetching platform images:', platformError);
        return NextResponse.json([]);
      }

      const fallbackData = (platformImages || []).map(image => ({
        id: image.id,
        result_image_url: image.image_url,
        title: image.title || 'Creative Work',
        description: image.alt_text || '',
        tags: [image.category].filter(Boolean),
        created_at: new Date().toISOString(),
        user_id: null,
        users_profile: {
          display_name: 'Preset Platform',
          handle: 'preset',
          verified_id: true
        }
      }));

      return NextResponse.json(fallbackData);
    }

    // Get unique user IDs
    const userIds = [...new Set(images.map(img => img.user_id).filter(Boolean))];

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('user_id, display_name, handle, verified_id')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Combine images/videos with user profiles
    const data = images.map(image => {
      const profile = profiles?.find(p => p.user_id === image.user_id);

      return {
        id: image.id,
        result_image_url: image.image_url,
        video_url: image.video_url,
        media_type: image.media_type || 'image',
        title: image.title || 'Creative Project',
        description: image.description || '',
        tags: image.tags || [],
        created_at: image.created_at,
        user_id: image.user_id,
        width: image.width,
        height: image.height,
        users_profile: profile
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
