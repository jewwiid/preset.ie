import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { getUserFromRequest } from '../../../../lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // const user = await getUserFromRequest(request);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('custom_scene_moods')
      .select('*')
      .or('is_public.eq.true')
      .order('usage_count', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: moods, error, count } = await query;

    if (error) {
      console.error('Error fetching custom scene moods:', error);
      return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      moods: moods || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Custom moods API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // const user = await getUserFromRequest(request);
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const {
      name,
      description,
      color_palette,
      lighting_style,
      atmosphere_description,
      example_prompts = [],
      is_public = false
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Check if mood with same name already exists for this user
    const { data: existingMood } = await supabaseAdmin
      .from('custom_scene_moods')
      .select('id')
      .eq('name', name)
      .eq('created_by', 'temp-user-id')
      .single();

    if (existingMood) {
      return NextResponse.json(
        { error: 'Scene mood with this name already exists' },
        { status: 400 }
      );
    }

    // Create mood
    const { data: mood, error } = await supabaseAdmin
      .from('custom_scene_moods')
      .insert({
        name,
        description,
        color_palette,
        lighting_style,
        atmosphere_description,
        example_prompts,
        is_public,
        created_by: 'temp-user-id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom scene mood:', error);
      return NextResponse.json({ error: 'Failed to create mood' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mood
    });

  } catch (error) {
    console.error('Create custom mood error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
