import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('Error verifying user token:', userError);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    if (!user) {
      console.error('No user found for token');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Get user's presets
    const { data: userPresets, error: presetsError } = await supabase
      .from('presets')
      .select('id, name')
      .eq('user_id', user.id);

    if (presetsError) {
      console.error('Error fetching user presets:', presetsError);
      return NextResponse.json({ error: 'Failed to fetch user presets' }, { status: 500 });
    }

    if (!userPresets || userPresets.length === 0) {
      return NextResponse.json({ images: [] });
    }

    const presetIds = userPresets.map(p => p.id);

    // Get media generated using user's presets
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select(`
        id,
        url,
        exif_json,
        created_at,
        user_id
      `)
      .in('exif_json->generation_metadata->preset_id', presetIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (mediaError) {
      console.error('Error fetching media:', mediaError);
      return NextResponse.json({ error: 'Failed to fetch generated media' }, { status: 500 });
    }

    if (!media || media.length === 0) {
      return NextResponse.json({ images: [] });
    }

    // Get user profiles for creators
    const userIds = [...new Set(media.map(m => m.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('id, display_name, handle, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const profilesMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
    }

    // Format the response
    const images = media.map(item => {
      const metadata = item.exif_json?.generation_metadata || {};
      const presetId = metadata.preset_id;
      const preset = userPresets.find(p => p.id === presetId);
      const creator = profilesMap.get(item.user_id) || {
        id: item.user_id,
        display_name: 'Unknown User',
        handle: 'unknown',
        avatar_url: null
      };

      return {
        id: item.id,
        url: item.url,
        prompt: metadata.prompt || 'No prompt available',
        preset_id: presetId,
        preset_name: preset?.name || 'Unknown Preset',
        created_at: item.created_at,
        creator: {
          id: creator.id,
          display_name: creator.display_name,
          handle: creator.handle,
          avatar_url: creator.avatar_url
        }
      };
    });

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Error in my-generated-content API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
