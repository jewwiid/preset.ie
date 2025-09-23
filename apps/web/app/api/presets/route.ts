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

    // Fetch regular presets
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
      .order(sort === 'popular' ? 'usage_count' : sort, { ascending: sort === 'created_at' ? false : (sort === 'name' ? true : false) });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: presets, error, count } = await query;

    // Fetch cinematic presets
    let cinematicQuery = supabase
      .from('cinematic_presets')
      .select(`
        id,
        name,
        display_name,
        description,
        category,
        parameters,
        sort_order,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Apply filters to cinematic presets
    if (category && category !== 'all') {
      cinematicQuery = cinematicQuery.eq('category', category);
    }

    if (search) {
      cinematicQuery = cinematicQuery.or(`display_name.ilike.%${search}%, description.ilike.%${search}%`);
    }

    const { data: cinematicPresets, error: cinematicError } = await cinematicQuery;

    if (error) {
      console.error('Error fetching presets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presets' },
        { status: 500 }
      );
    }

    // Format regular presets
    const formattedRegularPresets = presets?.map(preset => ({
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

    // Format cinematic presets to match the expected structure
    const formattedCinematicPresets = cinematicPresets?.map(cinematicPreset => {
      // Map generic categories to more specific ones
      let specificCategory = cinematicPreset.category;
      if (cinematicPreset.name === 'portrait') specificCategory = 'portrait';
      else if (cinematicPreset.name === 'landscape') specificCategory = 'nature';
      else if (cinematicPreset.name === 'fashion') specificCategory = 'fashion';
      else if (cinematicPreset.name === 'street') specificCategory = 'street';
      else if (cinematicPreset.name === 'nature') specificCategory = 'nature';
      else if (cinematicPreset.name === 'cinematic') specificCategory = 'cinematic';
      else if (cinematicPreset.name === 'urban') specificCategory = 'cinematic';
      
      return {
        id: `cinematic_${cinematicPreset.id}`,
        name: cinematicPreset.display_name,
        description: cinematicPreset.description,
        category: specificCategory,
        prompt_template: `Create a ${cinematicPreset.display_name.toLowerCase()} image with cinematic quality and professional composition`,
        negative_prompt: '',
        style_settings: {},
        technical_settings: {},
        cinematic_settings: {
          enableCinematicMode: true,
          cinematicParameters: cinematicPreset.parameters,
          enhancedPrompt: true,
          includeTechnicalDetails: true,
          includeStyleReferences: true,
          generationMode: 'text-to-image',
          selectedProvider: 'nanobanana'
        },
        sample_images: undefined,
        ai_metadata: {
          cinematic_settings: {
            enableCinematicMode: true,
            cinematicParameters: cinematicPreset.parameters,
            enhancedPrompt: true,
            includeTechnicalDetails: true,
            includeStyleReferences: true,
            generationMode: 'text-to-image',
            selectedProvider: 'nanobanana'
          }
        },
        seedream_config: {},
        usage_count: 0,
        is_public: true,
        is_featured: false,
        created_at: cinematicPreset.created_at,
        updated_at: cinematicPreset.updated_at,
        creator: {
          id: 'preset',
          display_name: 'Preset',
          handle: 'preset',
          avatar_url: null
        }
      };
    }) || [];

    // Combine both types of presets
    let formattedPresets = [...formattedCinematicPresets, ...formattedRegularPresets];

    // Apply client-side sorting for combined results
    if (sort === 'popular' || sort === 'usage_count') {
      formattedPresets.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    } else if (sort === 'name') {
      formattedPresets.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'created_at') {
      formattedPresets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Fetch sample images from the dedicated table for each preset (only for regular presets)
    for (const preset of formattedPresets) {
      // Skip cinematic presets as they don't have sample images
      if (preset.id.startsWith('cinematic_')) {
        continue;
      }
      
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

    // Apply pagination to combined results
    const totalPresets = formattedPresets.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPresets = formattedPresets.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(totalPresets / limit);

    return NextResponse.json({
      presets: paginatedPresets,
      pagination: {
        page,
        limit,
        total: totalPresets,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { presetId } = body;

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if it's a cinematic preset
    if (presetId.startsWith('cinematic_')) {
      const actualId = presetId.replace('cinematic_', '');
      
      // For cinematic presets, we'll track usage in a separate table or add a usage_count field
      // For now, we'll just return success as cinematic presets don't have usage tracking yet
      return NextResponse.json({
        message: 'Usage tracked for cinematic preset'
      });
    }

    // Increment usage count for regular presets
    // First get the current usage count
    const { data: currentPreset, error: fetchError } = await supabase
      .from('presets')
      .select('usage_count')
      .eq('id', presetId)
      .single();

    if (fetchError || !currentPreset) {
      console.error('Error fetching preset for usage update:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch preset for usage update' },
        { status: 500 }
      );
    }

    // Increment the usage count
    const { error } = await supabase
      .from('presets')
      .update({ 
        usage_count: (currentPreset.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', presetId);

    if (error) {
      console.error('Error updating preset usage:', error);
      return NextResponse.json(
        { error: 'Failed to update preset usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Usage tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking preset usage:', error);
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