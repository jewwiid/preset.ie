import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../../../../lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile ID
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get playground gallery items
    const { data: galleryItems, error: galleryError } = await supabase
      .from('playground_gallery')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (galleryError) {
      console.error('Error fetching gallery items:', galleryError);
      return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 });
    }

    // Get promoted media items (those that were promoted from playground)
    const { data: promotedMedia, error: mediaError } = await supabase
      .from('media')
      .select('id, path, exif_json')
      .eq('owner_user_id', userProfile.id)
      .not('exif_json->promoted_from_playground', 'is', null);

    if (mediaError) {
      console.error('Error fetching promoted media:', mediaError);
      // Don't fail, just continue without promotion status
    }

    // Create a map of promoted images for quick lookup
    const promotedMap = new Map();
    if (promotedMedia) {
      promotedMedia.forEach(media => {
        const originalGalleryId = media.exif_json?.original_gallery_id;
        if (originalGalleryId) {
          promotedMap.set(originalGalleryId, media.id);
        }
      });
    }

    // Add promotion status to gallery items
    const galleryWithStatus = galleryItems.map(item => ({
      ...item,
      is_promoted: promotedMap.has(item.id),
      media_id: promotedMap.get(item.id) || null,
      can_promote: !promotedMap.has(item.id) // Can promote if not already promoted
    }));

    return NextResponse.json({
      success: true,
      gallery: galleryWithStatus,
      totalItems: galleryWithStatus.length,
      promotedCount: promotedMap.size
    });

  } catch (error: any) {
    console.error('Error in gallery-with-status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
