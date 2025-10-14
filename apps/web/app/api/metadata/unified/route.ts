import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Normalize generation metadata from different sources to unified format
function normalizeGenerationMetadata(rawMetadata: any) {
  if (!rawMetadata) return {};
  
  return {
    // Core generation info
    prompt: rawMetadata.prompt,
    enhanced_prompt: rawMetadata.enhanced_prompt,
    provider: rawMetadata.provider || rawMetadata.generation_provider,
    generation_mode: rawMetadata.generation_mode || 'text-to-image',
    credits_used: rawMetadata.credits_used,
    resolution: rawMetadata.resolution,
    aspect_ratio: rawMetadata.aspect_ratio || rawMetadata.saved_aspect_ratio,
    
    // Style and preset info
    style: rawMetadata.style || rawMetadata.style_applied,
    style_prompt: rawMetadata.style_prompt,
    preset_id: rawMetadata.preset_id,
    preset_name: rawMetadata.preset_name,
    custom_style_preset: rawMetadata.custom_style_preset,
    consistency_level: rawMetadata.consistency_level,
    intensity: rawMetadata.intensity,
    
    // Cinematic parameters
    cinematic_parameters: rawMetadata.cinematic_parameters,
    
    // Technical settings
    include_technical_details: rawMetadata.include_technical_details,
    include_style_references: rawMetadata.include_style_references,
    user_subject: rawMetadata.user_subject,
    
    // Base image (for image-to-image)
    base_image: rawMetadata.base_image,
    
    // Video-specific parameters
    camera_movement: rawMetadata.camera_movement,
    y_position: rawMetadata.y_position,
    custom_dimensions: rawMetadata.custom_dimensions,
    duration: rawMetadata.duration,
    
    // Source image info (for video)
    image_url: rawMetadata.image_url,
    styled_image_url: rawMetadata.styled_image_url,
    processed_image_url: rawMetadata.processed_image_url,
    
    // API details
    api_endpoint: rawMetadata.api_endpoint,
    taskId: rawMetadata.taskId || rawMetadata.task_id,
    
    // Storage info
    original_url: rawMetadata.original_url,
    permanently_stored: rawMetadata.permanently_stored,
    storage_method: rawMetadata.storage_method,
    saved_at: rawMetadata.saved_at,
    
    // Timestamps
    generated_at: rawMetadata.generated_at || rawMetadata.created_at,
    
    // Legacy fields for backward compatibility
    cost: rawMetadata.cost,
    
    // Preserve any other fields
    ...rawMetadata
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');
    const source = searchParams.get('source') || 'gallery';

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    let metadata: any = null;

    // Fetch from appropriate source
    if (source === 'gallery') {
      const { data: galleryItem } = await supabaseAdmin
        .from('playground_gallery')
        .select('*')
        .eq('id', mediaId)
        .eq('user_id', user.id)
        .single();

      if (galleryItem) {
        metadata = {
          id: galleryItem.id,
          type: galleryItem.media_type,
          url: galleryItem.image_url || galleryItem.video_url,
          title: galleryItem.title,
          description: galleryItem.description,
          tags: galleryItem.tags || [],
          width: galleryItem.width,
          height: galleryItem.height,
          generation_metadata: normalizeGenerationMetadata(galleryItem.generation_metadata),
        };
      }
    } else if (source === 'project') {
      const { data: project } = await supabaseAdmin
        .from('playground_projects')
        .select('*')
        .eq('id', mediaId)
        .eq('user_id', user.id)
        .single();

      if (project) {
        metadata = {
          id: project.id,
          type: 'image',
          url: project.selected_image_url,
          title: project.title,
          description: project.description,
          width: project.metadata?.width,
          height: project.metadata?.height,
          generation_metadata: normalizeGenerationMetadata({
            ...project.generation_metadata,
            // Add project-level fields
            prompt: project.prompt,
            provider: project.provider,
            resolution: project.resolution,
            aspect_ratio: project.aspect_ratio,
            cinematic_parameters: project.cinematic_parameters,
            generation_mode: project.generation_type,
          }),
        };
      }
    } else if (source === 'showcase') {
      const { data: showcase } = await supabaseAdmin
        .from('showcase_media')
        .select(`
          *,
          showcase:showcases(
            id,
            title,
            caption
          )
        `)
        .eq('id', mediaId)
        .single();

      if (showcase) {
        metadata = {
          id: showcase.id,
          type: showcase.media_type,
          url: showcase.media_url,
          title: showcase.title,
          description: showcase.description,
          width: showcase.width,
          height: showcase.height,
          generation_metadata: normalizeGenerationMetadata(showcase.generation_metadata),
          preset_info: showcase.preset_info,
        };
      }
    }

    if (!metadata) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Fetch source images if Stitch generation
    if (metadata.generation_metadata?.generation_mode === 'stitch') {
      const { data: sourceRefs } = await supabaseAdmin
        .from('generation_source_references')
        .select(`
          source_image:source_images(
            id,
            original_url,
            thumbnail_url,
            image_type,
            custom_label,
            width,
            height
          ),
          sequence_order,
          image_role
        `)
        .eq('generation_id', mediaId)
        .eq('generation_type', source)
        .order('sequence_order');

      if (sourceRefs) {
        metadata.source_images = sourceRefs.map((ref: any) => ({
          ...ref.source_image,
          type: ref.image_role,
          url: ref.source_image.original_url
        }));
      }
    }

    // Fetch cross-references
    const { data: crossRefs } = await supabaseAdmin
      .from('media_cross_references')
      .select('*')
      .eq('source_media_id', mediaId)
      .eq('source_media_type', source)
      .limit(10);

    if (crossRefs) {
      metadata.cross_references = crossRefs.map((ref: any) => ({
        id: ref.referenced_in_id,
        type: ref.referenced_in_type,
        context: ref.reference_context
      }));
    }

    return NextResponse.json({ metadata });
  } catch (error) {
    console.error('Error fetching unified metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
