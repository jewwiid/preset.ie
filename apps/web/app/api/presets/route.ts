import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from('presets')
      .select(`
        id,
        name,
        description,
        category,
        prompt_template,
        negative_prompt,
        style_settings,
        technical_settings,
        ai_metadata,
        seedream_config,
        usage_count,
        is_public,
        is_featured,
        created_at,
        updated_at,
        user_id
      `)
      .eq('is_public', true) // Only show public presets
      .order(sort === 'popular' ? 'usage_count' : sort, { ascending: sort === 'created_at' ? false : true });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%, ai_metadata->tags.cs.{${search}}`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: presets, error, count } = await query;

    if (error) {
      console.error('Error fetching presets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presets' },
        { status: 500 }
      );
    }

    // Format response
    const formattedPresets = presets?.map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      category: preset.category,
      prompt_template: preset.prompt_template,
      negative_prompt: preset.negative_prompt,
      style_settings: preset.style_settings,
      technical_settings: preset.technical_settings,
      cinematic_settings: preset.ai_metadata?.cinematic_settings, // Extract cinematic_settings from ai_metadata
      sample_images: preset.ai_metadata?.sample_images, // Keep legacy sample_images from ai_metadata for backward compatibility
      ai_metadata: preset.ai_metadata,
      seedream_config: preset.seedream_config,
      usage_count: preset.usage_count || 0,
      is_public: preset.is_public,
      is_featured: preset.is_featured,
      created_at: preset.created_at,
      updated_at: preset.updated_at,
      creator: {
        id: preset.user_id,
        display_name: 'Unknown',
        handle: 'unknown',
        avatar_url: null
      }
    })) || [];

    // Fetch sample images from the dedicated table for each preset
    for (const preset of formattedPresets) {
      try {
        const { data: sampleImages } = await supabase
          .from('preset_images')
          .select('image_url, image_type')
          .eq('preset_id', preset.id)
          .order('image_type, created_at')
        
        if (sampleImages && sampleImages.length > 0) {
          const beforeImages = sampleImages.filter(img => img.image_type === 'before').map(img => img.image_url)
          const afterImages = sampleImages.filter(img => img.image_type === 'after').map(img => img.image_url)
          
          // Override sample_images with data from the dedicated table
          preset.sample_images = {
            before_images: beforeImages,
            after_images: afterImages,
            descriptions: [
              ...beforeImages.map(() => 'Original input image'),
              ...afterImages.map(() => 'Generated result')
            ]
          }
        }
      } catch (error) {
        console.error(`Error fetching sample images for preset ${preset.id}:`, error)
        // Keep the legacy sample_images from ai_metadata if the new table fails
      }
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      presets: formattedPresets,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error in presets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      prompt_template,
      negative_prompt,
        style_settings,
        technical_settings,
        cinematic_settings,
        sample_images,
        ai_metadata,
        seedream_config,
        is_public,
        is_featured
    } = body;

    // Merge cinematic_settings and sample_images into ai_metadata since that's what the database expects
    const mergedAiMetadata = {
      ...ai_metadata,
      cinematic_settings: cinematic_settings,
      sample_images: sample_images
    };

    // Validate required fields
    if (!name || !prompt_template) {
      return NextResponse.json(
        { error: 'Name and prompt template are required' },
        { status: 400 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Create preset
    const { data: preset, error: insertError } = await supabase
      .from('presets')
      .insert({
        name,
        description,
        category,
        prompt_template,
        negative_prompt,
        style_settings,
        technical_settings,
        ai_metadata: mergedAiMetadata,
        seedream_config,
        is_public: is_public || false,
        is_featured: is_featured || false,
        user_id: user.id,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating preset:', insertError);
      return NextResponse.json(
        { error: 'Failed to create preset' },
        { status: 500 }
      );
    }

    // Copy sample images to dedicated table if they exist
    if (sample_images && (sample_images.before_images?.length > 0 || sample_images.after_images?.length > 0)) {
      try {
        // Create preset_images table if it doesn't exist
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS preset_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('before', 'after')),
            original_gallery_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_preset_images_preset_id ON preset_images(preset_id);
          CREATE INDEX IF NOT EXISTS idx_preset_images_type ON preset_images(image_type);
          
          ALTER TABLE preset_images ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can manage preset images for their presets" ON preset_images;
          CREATE POLICY "Users can manage preset images for their presets" ON preset_images
            FOR ALL USING (
              auth.uid() = (SELECT user_id FROM presets WHERE id = preset_images.preset_id)
            );
        `
        
        // Execute the table creation (ignore errors if table already exists)
        try {
          await supabase.rpc('exec_sql', { sql: createTableQuery })
        } catch (error) {
          // Table might already exist, continue
          console.log('Table creation failed (might already exist):', error)
        }

        // Insert sample images
        const imageInserts = []
        
        // Process before images
        if (sample_images.before_images && sample_images.before_images.length > 0) {
          for (const imageUrl of sample_images.before_images) {
            imageInserts.push({
              preset_id: preset.id,
              image_url: imageUrl,
              image_type: 'before',
              original_gallery_id: null
            })
          }
        }
        
        // Process after images
        if (sample_images.after_images && sample_images.after_images.length > 0) {
          for (const imageUrl of sample_images.after_images) {
            imageInserts.push({
              preset_id: preset.id,
              image_url: imageUrl,
              image_type: 'after',
              original_gallery_id: null
            })
          }
        }

        if (imageInserts.length > 0) {
          const { error: imageInsertError } = await supabase
            .from('preset_images')
            .insert(imageInserts)
          
          if (imageInsertError) {
            console.error('Error inserting preset images:', imageInsertError)
            // Don't fail the entire preset creation, just log the error
          }
        }
      } catch (imageError) {
        console.error('Error copying sample images:', imageError)
        // Don't fail the entire preset creation, just log the error
      }
    }

    return NextResponse.json({
      id: preset.id,
      message: 'Preset created successfully'
    });

  } catch (error) {
    console.error('Error creating preset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get('id');

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Delete preset (RLS policy ensures user can only delete their own presets)
    const { error: deleteError } = await supabase
      .from('presets')
      .delete()
      .eq('id', presetId)
      .eq('user_id', user.id); // Double check ownership

    if (deleteError) {
      console.error('Error deleting preset:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Preset deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting preset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}