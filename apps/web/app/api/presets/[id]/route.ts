import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get preset by ID
    const { data: preset, error } = await supabase
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
        creator_id,
        users_profile!presets_creator_id_fkey (
          id,
          display_name,
          handle,
          avatar_url
        )
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
        
        isCreator = profile?.id === preset.creator_id;
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
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        isLiked = likes?.some(like => like.user_id === profile?.id) || false;
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
      creator: {
        id: preset.users_profile?.[0]?.id,
        display_name: preset.users_profile?.[0]?.display_name || 'Unknown',
        handle: preset.users_profile?.[0]?.handle || 'unknown',
        avatar_url: preset.users_profile?.[0]?.avatar_url
      }
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
      .select('creator_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPreset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    if (existingPreset.creator_id !== profile.id) {
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
      .select('creator_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPreset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    if (existingPreset.creator_id !== profile.id) {
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