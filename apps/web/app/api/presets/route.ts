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
    const userId = searchParams.get('user_id');

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header if userId is 'me'
    let currentUserId = null;
    if (userId === 'me') {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          currentUserId = user.id;
        }
      }
    } else if (userId) {
      currentUserId = userId;
    }

    // Fetch presets from both tables and combine them
    const [regularPresetsResult, cinematicPresetsResult] = await Promise.all([
      supabase
      .from('presets')
      .select(`
        id,
          user_id,
          name,
          display_name,
          description,
          category,
          prompt_template,
          negative_prompt,
          style_settings,
          technical_settings,
          ai_metadata,
          seedream_config,
          generation_mode,
          usage_count,
          likes_count,
          is_public,
          is_featured,
          is_active,
          sort_order,
          created_at,
          updated_at
        `),
      supabase
        .from('cinematic_presets')
        .select(`
          id,
          user_id,
        name,
          display_name,
        description,
        category,
        prompt_template,
        negative_prompt,
        style_settings,
        technical_settings,
        ai_metadata,
        seedream_config,
          generation_mode,
        usage_count,
        likes_count,
        is_public,
        is_featured,
          is_active,
          sort_order,
        created_at,
          updated_at
        `)
    ]);

    if (regularPresetsResult.error) {
      console.error('Error fetching regular presets:', regularPresetsResult.error);
      return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
    }

    if (cinematicPresetsResult.error) {
      console.error('Error fetching cinematic presets:', cinematicPresetsResult.error);
      return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
    }

    // Combine and add preset_type
    const allPresets = [
      ...(regularPresetsResult.data || []).map(preset => ({ ...preset, preset_type: 'regular' })),
      ...(cinematicPresetsResult.data || []).map(preset => ({ ...preset, preset_type: 'cinematic' }))
    ];

    // Apply filters to the combined data
    let filteredPresets = allPresets;

    // Apply user filter if specified
    if (currentUserId) {
      filteredPresets = filteredPresets.filter(preset => preset.user_id === currentUserId);
    } else {
      // Only show public presets if no user filter
      filteredPresets = filteredPresets.filter(preset => preset.is_public === true);
    }

    // Apply category filter
    if (category && category !== 'all') {
      filteredPresets = filteredPresets.filter(preset => preset.category === category);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPresets = filteredPresets.filter(preset => 
        preset.name?.toLowerCase().includes(searchLower) ||
        preset.display_name?.toLowerCase().includes(searchLower) ||
        preset.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sort === 'popular') {
      filteredPresets.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    } else if (sort === 'likes') {
      filteredPresets.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sort === 'name') {
      filteredPresets.sort((a, b) => (a.display_name || a.name || '').localeCompare(b.display_name || b.name || ''));
    } else {
      filteredPresets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit;
    const presets = filteredPresets.slice(from, to);
    const count = filteredPresets.length;

    // Fetch user profiles for presets that have user_id
    const userIds = [...new Set(presets?.map(p => p.user_id).filter(Boolean) || [])];
    let userProfiles: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('id, user_id, display_name, handle, avatar_url')
        .in('user_id', userIds);

      if (profiles) {
        userProfiles = profiles.reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {});
      }
    }

    // Format all presets using unified structure
    const formattedPresets = presets?.map(preset => {
      const userProfile = preset.user_id ? userProfiles[preset.user_id] : null;
      
      // For cinematic presets, we need to get the parameters and map them
      let mappedPreset = {
        id: preset.id,
        preset_type: preset.preset_type,
        name: preset.display_name || preset.name,
        description: preset.description,
        category: preset.category,
        prompt_template: preset.prompt_template,
        negative_prompt: preset.negative_prompt,
        style_settings: preset.style_settings,
        technical_settings: preset.technical_settings,
        ai_metadata: preset.ai_metadata,
        seedream_config: preset.seedream_config,
        generation_mode: preset.generation_mode,
        usage_count: preset.usage_count || 0,
        likes_count: preset.likes_count || 0,
        is_public: preset.is_public,
        is_featured: preset.is_featured,
        is_active: preset.is_active,
        sort_order: preset.sort_order,
        created_at: preset.created_at,
        updated_at: preset.updated_at,
        creator: userProfile ? {
          id: userProfile.id,
          display_name: userProfile.display_name || 'Unknown',
          handle: userProfile.handle || 'unknown',
          avatar_url: userProfile.avatar_url
        } : {
          id: preset.user_id || 'preset',
          display_name: preset.user_id ? 'Unknown' : 'System',
          handle: preset.user_id ? 'unknown' : 'preset',
          avatar_url: preset.user_id ? null : null
        }
      };
      
      // For cinematic presets, map the parameters to the expected fields
      if (preset.preset_type === 'cinematic' && preset.style_settings) {
        // The cinematic parameters should already be in style_settings from the unified view
        // But let's ensure they're mapped to the right places
        const cinematicParams = preset.style_settings;
        
        // Helper function to format values for display
        const formatForDisplay = (value: string) => {
          if (!value) return value;
          return value
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        
        mappedPreset = {
          ...mappedPreset,
          style_settings: {
            ...preset.style_settings,
            style: formatForDisplay(cinematicParams.directorStyle || cinematicParams.lightingStyle || cinematicParams.colorPalette),
            mood: formatForDisplay(cinematicParams.sceneMood),
            directorStyle: cinematicParams.directorStyle,
            lightingStyle: cinematicParams.lightingStyle,
            colorPalette: cinematicParams.colorPalette,
            sceneMood: cinematicParams.sceneMood,
            aspectRatio: cinematicParams.aspectRatio
          },
          technical_settings: {
            ...preset.technical_settings,
            resolution: cinematicParams.resolution || '1024x1024',
            steps: 20,
            guidance_scale: 7.5
          },
        ai_metadata: {
            ...preset.ai_metadata,
            style: cinematicParams.directorStyle || cinematicParams.lightingStyle || cinematicParams.colorPalette,
            mood: cinematicParams.sceneMood,
            steps: 20,
            guidance_scale: 7.5,
            resolution: cinematicParams.resolution || '1024x1024'
          }
        };
      }
      
      return mappedPreset;
    }) || [];

    // All presets are now formatted consistently using the unified structure


    // Apply client-side sorting for combined results
    if (sort === 'popular' || sort === 'usage_count') {
      formattedPresets.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    } else if (sort === 'likes' || sort === 'likes_count') {
      formattedPresets.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
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
          
          // Add sample_images to the preset object
          const presetWithSamples = {
            ...preset,
            sample_images: {
            before_images: beforeImages,
            after_images: afterImages,
            descriptions: [
              ...beforeImages.map(() => 'Original input image'),
              ...afterImages.map(() => 'Generated result')
            ]
            }
          };
          
          // Replace the preset in the array
          const presetIndex = presets.findIndex(p => p.id === preset.id);
          if (presetIndex !== -1) {
            presets[presetIndex] = presetWithSamples as any;
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

    // Check for existing preset with same name (case-insensitive)
    const { data: existingPreset, error: checkError } = await supabase
      .from('presets')
      .select('id, name, user_id')
      .ilike('name', name.trim())
      .single();

    if (existingPreset) {
      // If it's a system preset (user_id is null), don't allow user to create duplicate
      if (existingPreset.user_id === null) {
        return NextResponse.json(
          { error: `A preset named "${name}" already exists. Please choose a different name.` },
          { status: 409 }
        );
      }
      // If it's the same user's preset, suggest updating instead
      if (existingPreset.user_id === user.id) {
        return NextResponse.json(
          { error: `You already have a preset named "${name}". Please choose a different name or update the existing one.` },
          { status: 409 }
        );
      }
      // If it's another user's preset, allow creation (different users can have same preset names)
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
      // Cinematic presets don't have usage tracking yet
      return NextResponse.json({
        message: 'Usage tracked for cinematic preset'
      });
    }

    // NOTE: Usage count is now automatically incremented via database trigger
    // when preset_usage records are inserted via track_preset_usage() function.
    // No manual increment needed here - the trigger handles it automatically.
    // See migration: 20250930000001_fix_usage_tracking.sql

    // Verify preset exists
    const { data: preset, error: fetchError } = await supabase
      .from('presets')
      .select('id, usage_count')
      .eq('id', presetId)
      .single();

    if (fetchError || !preset) {
      console.error('Error fetching preset for usage tracking:', fetchError);
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Usage tracking endpoint - usage is now tracked via /api/presets/[id]/usage',
      currentUsageCount: preset.usage_count || 0
    });

  } catch (error) {
    console.error('Error in preset usage endpoint:', error);
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