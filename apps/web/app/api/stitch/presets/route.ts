import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's presets + public presets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all'; // 'all', 'mine', 'public', 'liked'
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase.from('stitch_presets').select(`
      *,
      is_liked:stitch_preset_likes!inner(user_id)
    `);

    // Apply scope filters
    if (scope === 'mine') {
      query = query.eq('user_id', user.id);
    } else if (scope === 'public') {
      query = query.eq('is_public', true);
    } else if (scope === 'liked') {
      const { data: likedPresets } = await supabase
        .from('stitch_preset_likes')
        .select('preset_id')
        .eq('user_id', user.id);
      
      const likedIds = likedPresets?.map(l => l.preset_id) || [];
      if (likedIds.length === 0) {
        return NextResponse.json({ presets: [] });
      }
      query = query.in('id', likedIds);
    } else {
      // 'all' - user's own + public presets
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply ordering and limit
    query = query
      .order('likes_count', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(limit);

    const { data: presets, error } = await query;

    if (error) {
      console.error('Error fetching presets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presets' },
        { status: 500 }
      );
    }

    // Check which presets are liked by current user
    const presetsWithLikeStatus = await Promise.all(
      (presets || []).map(async (preset) => {
        const { data: liked } = await supabase
          .from('stitch_preset_likes')
          .select('user_id')
          .eq('preset_id', preset.id)
          .eq('user_id', user.id)
          .single();

        return {
          ...preset,
          is_mine: preset.user_id === user.id,
          is_liked: !!liked,
        };
      })
    );

    return NextResponse.json({ presets: presetsWithLikeStatus });
  } catch (error) {
    console.error('Presets GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new preset
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      prompt_template,
      required_image_types,
      optional_image_types,
      max_images_suggestion,
      aspect_ratio_suggestion,
      provider_preference,
      cinematic_parameters,
      examples,
      usage_instructions,
      tips,
      is_public,
    } = body;

    // Validate required fields
    if (!name || !category || !prompt_template || !required_image_types) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, prompt_template, required_image_types' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['character-scene', 'product-marketing', 'style-transfer', 'creative-composite'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Insert preset
    const { data: preset, error } = await supabase
      .from('stitch_presets')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description || null,
        category,
        prompt_template: prompt_template.trim(),
        required_image_types: required_image_types || [],
        optional_image_types: optional_image_types || [],
        max_images_suggestion: max_images_suggestion || 5,
        aspect_ratio_suggestion: aspect_ratio_suggestion || '1:1',
        provider_preference: provider_preference || 'nanobanana',
        cinematic_parameters: cinematic_parameters || {},
        examples: examples || [],
        usage_instructions: usage_instructions || null,
        tips: tips || null,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating preset:', error);
      return NextResponse.json(
        { error: 'Failed to create preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({ preset, message: 'Preset created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Presets POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update preset
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Update preset (RLS will ensure only owner can update)
    const { data: preset, error } = await supabase
      .from('stitch_presets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating preset:', error);
      return NextResponse.json(
        { error: 'Failed to update preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({ preset, message: 'Preset updated successfully' });
  } catch (error) {
    console.error('Presets PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete preset
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get('id');

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Delete preset (RLS will ensure only owner can delete)
    const { error } = await supabase
      .from('stitch_presets')
      .delete()
      .eq('id', presetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting preset:', error);
      return NextResponse.json(
        { error: 'Failed to delete preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Preset deleted successfully' });
  } catch (error) {
    console.error('Presets DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

