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
      ai_metadata,
      seedream_config,
      is_public,
      is_featured
    } = body;

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
        ai_metadata,
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