import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../../../../lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { galleryItemId, title, description, tags } = await request.json();

    if (!galleryItemId) {
      return NextResponse.json({ error: 'Gallery item ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the playground gallery item
    const { data: galleryItem, error: galleryError } = await supabase
      .from('playground_gallery')
      .select('*')
      .eq('id', galleryItemId)
      .eq('user_id', user.id) // Ensure user owns this item
      .single();

    if (galleryError || !galleryItem) {
      console.error('Error fetching gallery item:', galleryError);
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

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

    // Always create a new media record to ensure it has PUBLIC visibility
    console.log('Creating new media record for gallery item:', galleryItem.id);

    // Extract image dimensions from generation metadata
    let width = 1024; // Default fallback
    let height = 1024; // Default fallback

    if (galleryItem.generation_metadata) {
      const metadata = galleryItem.generation_metadata;
      
      // Try to get actual dimensions
      if (metadata.actual_width && metadata.actual_height) {
        width = metadata.actual_width;
        height = metadata.actual_height;
      } else if (metadata.saved_width && metadata.saved_height) {
        width = metadata.saved_width;
        height = metadata.saved_height;
      } else if (metadata.resolution) {
        // Parse resolution string like "1024x1024"
        const resolutionMatch = metadata.resolution.match(/(\d+)x(\d+)/);
        if (resolutionMatch) {
          width = parseInt(resolutionMatch[1]);
          height = parseInt(resolutionMatch[2]);
        }
      }
    }

    // Create media record
    const { data: mediaItem, error: mediaError } = await supabase
      .from('media')
      .insert({
        owner_user_id: userProfile.id,
        type: galleryItem.media_type?.toLowerCase() || 'image', // Use actual media type from gallery item
        bucket: 'external', // Use 'external' bucket for external URLs
        path: galleryItem.image_url, // Store the full URL as path for external images
        width: width,
        height: height,
        duration: galleryItem.video_duration || 0, // Use actual duration for videos
        palette: galleryItem.generation_metadata?.palette || null,
        blurhash: null, // Not stored in playground_gallery
        exif_json: {
          // Store generation metadata in exif_json for reference
          generation_metadata: galleryItem.generation_metadata,
          promoted_from_playground: true,
          original_gallery_id: galleryItem.id,
          promoted_at: new Date().toISOString(),
          external_url: true // Flag to indicate this is an external URL
        },
        visibility: 'PUBLIC' // Set to public so it can be viewed in showcases
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Error creating media item:', mediaError);
      return NextResponse.json({ error: 'Failed to promote image to media' }, { status: 500 });
    }

    console.log('Successfully promoted playground image to media:', mediaItem);

    return NextResponse.json({
      success: true,
      message: 'Image successfully promoted to media',
      mediaId: mediaItem.id,
      action: 'promoted',
      mediaItem: {
        id: mediaItem.id,
        url: galleryItem.image_url,
        type: 'image',
        width: width,
        height: height,
        created_at: mediaItem.created_at
      }
    });

  } catch (error: any) {
    console.error('Error in promote-to-media API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
