import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    
    // Handle cinematic preset IDs with prefix
    let id = rawId;
    let isCinematicPreset = false;
    
    if (rawId.startsWith('cinematic_')) {
      id = rawId.replace('cinematic_', '');
      isCinematicPreset = true;
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query the appropriate table based on preset type
    console.log(`Fetching preset ${id} (cinematic: ${isCinematicPreset})...`);
    
    const tableName = isCinematicPreset ? 'cinematic_presets' : 'presets';
    
    const { data: preset, error } = await supabase
      .from(tableName)
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
        is_public,
        is_featured,
        is_active,
        sort_order,
        usage_count,
        last_used_at,
        is_for_sale,
        sale_price,
        seller_user_id,
        marketplace_status,
        total_sales,
        revenue_earned,
        likes_count,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error || !preset) {
      console.error('Error fetching preset:', error);
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    // Get cinematic parameters from the original table if it's a cinematic preset
    let cinematicParameters = null;
    let updatedPreset: any = undefined;
    
    if (isCinematicPreset) {
      const { data: cinematicData } = await supabase
        .from('cinematic_presets')
        .select('parameters')
        .eq('id', id)
        .single();
      
      cinematicParameters = cinematicData?.parameters || null;
      
      // Map cinematic parameters to the fields the frontend expects
      if (cinematicParameters) {
        // Helper function to format values for display
        const formatForDisplay = (value: string) => {
          if (!value) return value;
          return value
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        
        // Extract style from directorStyle or lightingStyle
        const rawStyle = cinematicParameters.directorStyle || cinematicParameters.lightingStyle || cinematicParameters.colorPalette;
        const style = formatForDisplay(rawStyle);
        
        // Extract mood from sceneMood
        const rawMood = cinematicParameters.sceneMood;
        const mood = formatForDisplay(rawMood);
        
        // Extract resolution from aspectRatio
        const aspectRatio = cinematicParameters.aspectRatio;
        let resolution = null;
        if (aspectRatio) {
          // Convert aspect ratios to common resolutions
          switch (aspectRatio) {
            case '9:16':
              resolution = '1024x1820';
              break;
            case '16:9':
              resolution = '1920x1080';
              break;
            case '21:9':
              resolution = '2560x1080';
              break;
            case '4:3':
              resolution = '1024x768';
              break;
            case '3:2':
              resolution = '1024x683';
              break;
            case '1:1':
              resolution = '1024x1024';
              break;
            default:
              resolution = '1024x1024';
          }
        }
        
        // Set default values for steps and guidance scale
        const steps = 20;
        const guidanceScale = 7.5;
        
        // Update the preset object with mapped values
        updatedPreset = {
          ...preset,
          style_settings: {
            ...preset.style_settings,
            style: style,
            mood: mood,
            steps: steps,
            directorStyle: cinematicParameters.directorStyle,
            lightingStyle: cinematicParameters.lightingStyle,
            colorPalette: cinematicParameters.colorPalette,
            sceneMood: cinematicParameters.sceneMood,
            aspectRatio: cinematicParameters.aspectRatio
          },
          technical_settings: {
            ...preset.technical_settings,
            resolution: resolution,
            steps: steps,
            guidance_scale: guidanceScale,
            width: resolution?.split('x')[0],
            height: resolution?.split('x')[1]
          },
          ai_metadata: {
            ...preset.ai_metadata,
            style: style,
            mood: mood,
            steps: steps,
            guidance_scale: guidanceScale,
            resolution: resolution
          }
        };
      }
    } else {
      // For regular presets, format existing values if they exist
      if (preset.style_settings?.style) {
        const formatForDisplay = (value: string) => {
          if (!value) return value;
          return value
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        
        updatedPreset = {
          ...preset,
          style_settings: {
            ...preset.style_settings,
            style: formatForDisplay(preset.style_settings.style)
          }
        };
      }
    }

    // Get creator information if preset has a user_id
    // NOTE: presets.user_id references auth.users.id, so lookup users_profile by user_id field
    let creatorInfo = {
      id: null,
      display_name: 'System',
      handle: 'preset',
      avatar_url: null
    };

    if (preset.user_id) {
      const { data: creator } = await supabase
        .from('users_profile')
        .select('id, display_name, handle, avatar_url, first_name, last_name')
        .eq('user_id', preset.user_id) // Fixed: lookup by user_id, not id
        .single();

      if (creator) {
        creatorInfo = {
          id: creator.id,
          display_name: creator.display_name || creator.first_name || 'User',
          handle: creator.handle || 'user',
          avatar_url: creator.avatar_url
        };
      } else {
        // Profile doesn't exist - check if user exists in auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(preset.user_id);

        if (authUser?.user) {
          // User exists but has no profile - show email or "User"
          creatorInfo = {
            id: preset.user_id,
            display_name: authUser.user.email?.split('@')[0] || 'User',
            handle: authUser.user.email?.split('@')[0] || 'user',
            avatar_url: null
          };
        }
      }
    }

    // Check if preset is public or if user is the creator
    const authHeader = request.headers.get('authorization');
    let isCreator = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        isCreator = profile?.id === preset.user_id;
      }
    }

    // Only show public presets or presets owned by the user
    if (!preset.is_public && !isCreator) {
      return NextResponse.json(
        { error: 'Preset not found or not accessible' },
        { status: 404 }
      );
    }

    // Get like count and user's like status
    const { data: likes } = await supabase
      .from('preset_likes')
      .select('user_id')
      .eq('preset_id', id);

    const likeCount = likes?.length || 0;
    let isLiked = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        isLiked = likes?.some(like => like.user_id === user.id) || false;
      }
    }

    // Use updated preset if it was modified, otherwise use original
    const finalPreset = typeof updatedPreset !== 'undefined' ? updatedPreset : preset;

    // Format response using unified structure
    const response = {
      id: finalPreset.id,
      preset_type: isCinematicPreset ? 'cinematic' : 'regular',
      name: finalPreset.display_name || finalPreset.name,
      description: finalPreset.description,
      category: finalPreset.category,
      prompt_template: finalPreset.prompt_template,
      negative_prompt: finalPreset.negative_prompt,
      style_settings: finalPreset.style_settings,
      technical_settings: finalPreset.technical_settings,
      ai_metadata: finalPreset.ai_metadata,
      seedream_config: finalPreset.seedream_config,
      generation_mode: finalPreset.generation_mode,
      usage_count: finalPreset.usage_count || 0,
      is_public: finalPreset.is_public,
      is_featured: finalPreset.is_featured,
      is_active: finalPreset.is_active,
      sort_order: finalPreset.sort_order,
      last_used_at: finalPreset.last_used_at,
      is_for_sale: finalPreset.is_for_sale,
      sale_price: finalPreset.sale_price,
      marketplace_status: finalPreset.marketplace_status,
      total_sales: finalPreset.total_sales,
      revenue_earned: finalPreset.revenue_earned,
      created_at: finalPreset.created_at,
      updated_at: finalPreset.updated_at,
      like_count: likeCount,
      is_liked: isLiked,
      creator: creatorInfo,
      cinematic_parameters: cinematicParameters
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching preset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    // Get user profile ID
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user owns the preset
    const { data: existingPreset, error: fetchError } = await supabase
      .from('presets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPreset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    if (existingPreset.user_id !== profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this preset' },
        { status: 403 }
      );
    }

    // Update preset
    const { data: preset, error: updateError } = await supabase
      .from('presets')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating preset:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: preset.id,
      message: 'Preset updated successfully'
    });

  } catch (error) {
    console.error('Error updating preset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get user profile ID
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user owns the preset
    const { data: existingPreset, error: fetchError } = await supabase
      .from('presets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPreset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    if (existingPreset.user_id !== profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this preset' },
        { status: 403 }
      );
    }

    // Delete preset
    const { error: deleteError } = await supabase
      .from('presets')
      .delete()
      .eq('id', id);

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