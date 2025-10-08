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

    // Fetch promoted preset examples from playground_gallery
    const { data: images, error: imagesError } = await supabase
      .from('playground_gallery')
      .select(`
        id,
        result_image_url,
        prompt,
        preset_id,
        user_id,
        created_at,
        is_promoted_to_preset_example,
        presets (
          title,
          description
        )
      `)
      .eq('is_promoted_to_preset_example', true)
      .not('result_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (imagesError) {
      console.error('Error fetching preset images:', imagesError);
      return NextResponse.json({ error: 'Failed to fetch preset images' }, { status: 500 });
    }

    // Get unique user IDs
    const userIds = [...new Set(images?.map(img => img.user_id) || [])];

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('user_id, display_name, handle')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
    }

    // Combine images with user profiles and format for homepage
    const data = images?.map(image => ({
      id: image.id,
      result_image_url: image.result_image_url,
      title: image.presets?.title || 'Creative Project',
      description: image.prompt || image.presets?.description || '',
      tags: [],
      created_at: image.created_at,
      user_id: image.user_id,
      users_profile: profiles?.find(profile => profile.user_id === image.user_id)
    })) || [];

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
