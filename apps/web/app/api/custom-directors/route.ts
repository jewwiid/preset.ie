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

    // Build query using the actual director_styles table
    let query = supabaseAdmin
      .from('director_styles')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.ilike('label', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: directors, error, count } = await query;

    if (error) {
      console.error('Error fetching custom directors:', error);
      return NextResponse.json({ error: 'Failed to fetch directors' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      directors: directors || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Custom directors API error:', error);
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
      visual_style,
      signature_elements = [],
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

    // Check if director with same name already exists for this user
    const { data: existingDirector } = await supabaseAdmin
      .from('custom_directors')
      .select('id')
      .eq('name', name)
      .eq('created_by', 'temp-user-id')
      .single();

    if (existingDirector) {
      return NextResponse.json(
        { error: 'Director with this name already exists' },
        { status: 400 }
      );
    }

    // Create director
    const { data: director, error } = await supabaseAdmin
      .from('custom_directors')
      .insert({
        name,
        description,
        visual_style,
        signature_elements,
        example_prompts,
        is_public,
        created_by: 'temp-user-id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom director:', error);
      return NextResponse.json({ error: 'Failed to create director' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      director
    });

  } catch (error) {
    console.error('Create custom director error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
