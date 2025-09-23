import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log(`Media API called for auth user ID: ${user.id}`);

    // First, get the user's profile to get the correct user_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, user_id, display_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      console.log('Available users_profile records:', await supabase.from('users_profile').select('id, user_id, display_name').limit(5));
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log(`Found user profile: ${userProfile.display_name} (profile ID: ${userProfile.id}, auth user ID: ${user.id})`);

    // Check if there are any media records at all
    const { data: allMedia, error: allMediaError } = await supabase
      .from('media')
      .select('id, owner_user_id, type, path')
      .limit(5);

    console.log(`Total media records in database: ${allMedia?.length || 0}`);
    if (allMedia && allMedia.length > 0) {
      console.log('Sample media records:', allMedia);
    }

        // Get user's media from both media table and playground_gallery table
        console.log(`Querying media tables for user profile: ${userProfile.id}`);
        
        // Query media table
        const { data: mediaFromTable, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .eq('owner_user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (mediaError) {
          console.error('Error fetching media from media table:', mediaError);
        }

        // Query playground_gallery table
        const { data: galleryMedia, error: galleryError } = await supabase
          .from('playground_gallery')
          .select('*')
          .eq('user_id', user.id) // playground_gallery uses auth user_id
          .order('created_at', { ascending: false });

        if (galleryError) {
          console.error('Error fetching media from playground_gallery:', galleryError);
        }

        console.log(`Found ${mediaFromTable?.length || 0} media items from media table`);
        console.log(`Found ${galleryMedia?.length || 0} media items from playground_gallery table`);
        
        // Debug playground gallery items
        if (galleryMedia && galleryMedia.length > 0) {
          console.log('Sample playground gallery item:', galleryMedia[0]);
          console.log('Generation metadata:', galleryMedia[0].generation_metadata);
        }

        // Combine both sources
        const media = [
          ...(mediaFromTable || []).map(m => ({ ...m, source: 'media_table' })),
          ...(galleryMedia || []).map(m => ({ ...m, source: 'playground_gallery' }))
        ];

        console.log(`Total combined media items: ${media.length}`);
        if (media.length > 0) {
          console.log('Sample media record:', media[0]);
        } else {
          console.log('No media records found in either table');
        }

    // Transform media data to match expected format
    const formattedMedia = media.map(m => {
      let url, thumbnail_url, type, width, height, duration, palette, blurhash, metadata, preset;

      if (m.source === 'playground_gallery') {
        // Handle playground_gallery format
        url = m.image_url;
        thumbnail_url = m.thumbnail_url || m.image_url;
        type = 'image'; // playground_gallery is always images
        width = m.width;
        height = m.height;
        duration = 0; // Images don't have duration
        palette = m.generation_metadata?.palette || null;
        blurhash = null; // Not stored in playground_gallery
        metadata = m.generation_metadata || {};
        preset = m.generation_metadata?.preset || m.generation_metadata?.style || 'realistic';
        
        // Debug transformation
        console.log(`Transforming playground item ${m.id}:`, {
          hasGenerationMetadata: !!m.generation_metadata,
          metadata: m.generation_metadata,
          preset: preset
        });
      } else {
        // Handle media table format
        const { data: { publicUrl } } = supabase.storage
          .from(m.bucket)
          .getPublicUrl(m.path);
        
        url = publicUrl;
        thumbnail_url = publicUrl;
        type = m.type.toLowerCase(); // Convert 'IMAGE' to 'image', 'VIDEO' to 'video'
        width = m.width;
        height = m.height;
        duration = m.duration;
        palette = m.palette;
        blurhash = m.blurhash;
        metadata = m.ai_metadata || {};
        preset = m.ai_metadata?.style || m.ai_metadata?.preset || 'realistic';
      }

      return {
        id: m.id,
        url,
        type,
        thumbnail_url,
        width,
        height,
        duration,
        palette,
        blurhash,
        metadata,
        preset,
        created_at: m.created_at,
        source: m.source // Include source for debugging
      };
    });

    return NextResponse.json({
      media: formattedMedia
    });

  } catch (error: any) {
    console.error('Media API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
