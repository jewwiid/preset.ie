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

    // Fetch recent images from playground_gallery
    const { data: images, error: imagesError } = await supabase
      .from('playground_gallery')
      .select('id, image_url, thumbnail_url, title, description, tags, user_id, created_at')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (imagesError) {
      console.error('Error fetching preset images:', imagesError);
      return NextResponse.json({ error: 'Failed to fetch preset images', details: imagesError }, { status: 500 });
    }

    if (!images || images.length === 0) {
      console.log('No images found, returning empty array');
      return NextResponse.json([]);
    }

    // Get unique user IDs
    const userIds = [...new Set(images.map(img => img.user_id).filter(Boolean))];

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('user_id, display_name, handle')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Combine images with user profiles
    const data = images.map(image => {
      const profile = profiles?.find(p => p.user_id === image.user_id);

      return {
        id: image.id,
        result_image_url: image.image_url,
        title: image.title || 'Creative Project',
        description: image.description || '',
        tags: image.tags || [],
        created_at: image.created_at,
        user_id: image.user_id,
        users_profile: profile
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
