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

    let preset;
    let error;

    if (isCinematicPreset) {
      // Directly fetch from cinematic_presets table
      console.log(`Fetching cinematic preset ${id}...`);
      
      const { data: cinematicPreset, error: cinematicError } = await supabase
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
        .eq('id', id)
        .single();

      if (cinematicError || !cinematicPreset) {
        console.error('Error fetching cinematic preset:', cinematicError);
        return NextResponse.json(
          { error: 'Preset not found' },
          { status: 404 }
        );
      }

      // Convert cinematic preset to regular preset format
      preset = {
        id: cinematicPreset.id,
        name: cinematicPreset.display_name || cinematicPreset.name,
        description: cinematicPreset.description,
        category: cinematicPreset.category,
        prompt_template: '', // Cinematic presets don't have prompt templates
        negative_prompt: '',
        style_settings: null,
        technical_settings: null,
        ai_metadata: null,
        seedream_config: null,
        usage_count: 0, // Cinematic presets don't track usage yet
        likes_count: 0,
        is_public: true,
        is_featured: false,
        created_at: cinematicPreset.created_at,
        updated_at: cinematicPreset.updated_at,
        user_id: null, // Cinematic presets are system presets
        cinematic_parameters: cinematicPreset.parameters // Add cinematic parameters
      };
    } else {
      // Get preset by ID from regular presets table
      const result = await supabase
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
          likes_count,
          is_public,
          is_featured,
          created_at,
          updated_at,
          user_id
        `)
        .eq('id', id)
        .single();

      preset = result.data;
      error = result.error;

      // If not found in regular presets, check cinematic_presets table
      if (error || !preset) {
        console.log(`Preset ${id} not found in regular presets table, checking cinematic_presets...`);
        
        const { data: cinematicPreset, error: cinematicError } = await supabase
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
          .eq('id', id)
          .single();

        if (cinematicError || !cinematicPreset) {
          console.error('Error fetching preset from both tables:', error, cinematicError);
          return NextResponse.json(
            { error: 'Preset not found' },
            { status: 404 }
          );
        }

        // Convert cinematic preset to regular preset format
        preset = {
          id: cinematicPreset.id,
          name: cinematicPreset.display_name || cinematicPreset.name,
          description: cinematicPreset.description,
          category: cinematicPreset.category,
          prompt_template: '', // Cinematic presets don't have prompt templates
          negative_prompt: '',
          style_settings: null,
          technical_settings: null,
          ai_metadata: null,
          seedream_config: null,
          usage_count: 0, // Cinematic presets don't track usage yet
          likes_count: 0,
          is_public: true,
          is_featured: false,
          created_at: cinematicPreset.created_at,
          updated_at: cinematicPreset.updated_at,
          user_id: null, // Cinematic presets are system presets
          cinematic_parameters: cinematicPreset.parameters // Add cinematic parameters
        };
      }
    }

    // Get creator information if preset has a user_id
    let creatorInfo = {
      id: null,
      display_name: 'System',
      handle: 'preset',
      avatar_url: null
    };

    if (preset.user_id) {
      const { data: creator } = await supabase
        .from('users_profile')
        .select('id, display_name, handle, avatar_url')
        .eq('id', preset.user_id)
        .single();
      
      if (creator) {
        creatorInfo = creator;
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

    // Format response
    const response = {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      category: preset.category,
      prompt_template: preset.prompt_template,
      negative_prompt: preset.negative_prompt,
      style_settings: preset.style_settings,
      technical_settings: preset.technical_settings,
      ai_metadata: preset.ai_metadata,
      seedream_config: preset.seedream_config,
      usage_count: preset.usage_count || 0,
      is_public: preset.is_public,
      is_featured: preset.is_featured,
      created_at: preset.created_at,
      updated_at: preset.updated_at,
      like_count: likeCount,
      is_liked: isLiked,
      creator: creatorInfo,
      cinematic_parameters: (preset as any).cinematic_parameters || null
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