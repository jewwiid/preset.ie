import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { getUserFromRequest } from '../../../../lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.get('tags');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('cinematic_prompt_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.overlaps('tags', tagArray);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Error fetching cinematic prompt templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Cinematic prompts API error:', error);
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
      category,
      base_prompt,
      cinematic_parameters,
      difficulty = 'beginner',
      tags = [],
      is_public = false
    } = body;

    // Validate required fields
    if (!name || !category || !base_prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, base_prompt' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['portrait', 'landscape', 'street', 'cinematic', 'artistic', 'commercial', 'fashion', 'architecture', 'nature', 'abstract'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error } = await supabaseAdmin
      .from('cinematic_prompt_templates')
      .insert({
        name,
        description,
        category,
        base_prompt,
        cinematic_parameters: cinematic_parameters || {},
        difficulty,
        tags,
        is_public,
        created_by: 'temp-user-id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cinematic prompt template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Create cinematic prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
