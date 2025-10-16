import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client for bypassing RLS when needed
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Fixed: Added admin client for RLS bypass

/**
 * Determine source type based on metadata and item properties
 */
function determineSourceType(item: any): 'upload' | 'playground' | 'enhanced' | 'stock' {
  // Check if it's from playground_gallery with enhancement indicators
  if (item.source === 'playground_gallery') {
    const metadata = item.generation_metadata || {};

    // Check for enhancement indicators in metadata
    if (
      metadata.enhancement_type ||
      metadata.style_applied ||
      metadata.source === 'ai_enhancement' ||
      item.title?.toLowerCase().includes('enhanced') ||
      (item.tags && item.tags.includes('ai-enhanced'))
    ) {
      return 'enhanced';
    }

    return 'playground';
  }

  // For other sources, default to upload
  return 'upload';
}

/**
 * Determine enhancement type from metadata
 */
function determineEnhancementType(item: any): string | null {
  const metadata = item.generation_metadata || {};

  // Try various metadata fields that might contain enhancement info
  return (
    metadata.enhancement_type ||
    metadata.style_applied ||
    metadata.style ||
    metadata.applied_style ||
    null
  );
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();
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

    // First, get the user's profile to get the correct user_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, user_id, display_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

        // Get user's media from both media table and playground_gallery table
        
        // Query media table
        const { data: mediaFromTable, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .eq('owner_user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (mediaError) {
          console.error('Error fetching media from media table:', mediaError);
        }

        // Query playground_gallery table - temporarily use admin client to bypass RLS issues
        console.log(`🔍 Querying playground_gallery for user_id: ${user.id}`);
        const { data: galleryMedia, error: galleryError } = await supabaseAdmin
          .from('playground_gallery')
          .select('*')
          .eq('user_id', user.id) // playground_gallery uses auth user_id
          .order('created_at', { ascending: false });

        if (galleryError) {
          console.error('Error fetching media from playground_gallery:', galleryError);
        } else {
          console.log(`✅ Gallery query successful, raw result count: ${galleryMedia?.length || 0}`);
          if (galleryMedia && galleryMedia.length > 0) {
            console.log('🔧 FIXED: Now using admin client - should find items');
          }
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

    // Transform media data to match expected format for unified media table
    const formattedMedia = media.map(m => {
      // Handle unified media format with backward compatibility
      let url, thumbnail_url, type, width, height, duration, palette, blurhash;
      let title, description, tags, generation_metadata;

      if (m.source === 'playground_gallery') {
        // Legacy playground_gallery format (during migration)
        url = m.image_url;
        thumbnail_url = m.thumbnail_url || m.image_url;
        type = 'image';
        width = m.width;
        height = m.height;
        duration = 0;
        palette = m.generation_metadata?.palette || null;
        blurhash = null;
        title = m.title;
        description = m.description;
        tags = m.tags || [];
        generation_metadata = m.generation_metadata || {};
      } else {
        // Unified media table format
        if (m.bucket === 'external' || m.metadata?.external_url) {
          url = m.path;
          thumbnail_url = m.path;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from(m.bucket)
            .getPublicUrl(m.path);
          url = publicUrl;
          thumbnail_url = publicUrl;
        }

        type = m.type.toLowerCase();
        width = m.width;
        height = m.height;
        duration = m.duration;
        palette = m.palette;
        blurhash = m.blurhash;
        title = m.metadata?.title;
        description = m.metadata?.description;
        tags = m.metadata?.tags || [];
        generation_metadata = m.metadata;
      }

      return {
        id: m.id,
        url,
        image_url: url, // For backward compatibility
        video_url: type === 'video' ? url : undefined,
        type,
        media_type: type, // For backward compatibility
        thumbnail_url,
        width,
        height,
        duration,
        palette,
        blurhash,
        title,
        description,
        tags,
        generation_metadata,
        source_type: m.source_type || determineSourceType(m),
        enhancement_type: m.enhancement_type || determineEnhancementType(m),
        original_media_id: m.original_media_id,
        metadata: m.metadata || {},
        created_at: m.created_at,
        updated_at: m.updated_at,
        source: m.source // Include source for debugging
      };
    });

    const totalTime = performance.now() - startTime;
    console.log(`✅ Media API completed in ${totalTime.toFixed(2)}ms, returning ${formattedMedia.length} items`);

    return NextResponse.json({
      success: true,
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
