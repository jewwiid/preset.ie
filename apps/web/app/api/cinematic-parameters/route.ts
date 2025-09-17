import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Define all parameter tables
    const parameterTables = [
      'camera_angles',
      'lens_types', 
      'shot_sizes',
      'depth_of_field',
      'composition_techniques',
      'lighting_styles',
      'color_palettes',
      'director_styles',
      'era_emulations',
      'scene_moods',
      'camera_movements',
      'aspect_ratios',
      'time_settings',
      'weather_conditions',
      'location_types',
      'foreground_elements',
      'subject_counts',
      'eye_contacts'
    ];

    // If specific category requested, fetch only that
    if (category && parameterTables.includes(category)) {
      let query = supabaseAdmin
        .from(category)
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (search) {
        query = query.or(`label.ilike.%${search}%,description.ilike.%${search}%`);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error(`Error fetching ${category}:`, error);
        return NextResponse.json({ error: `Failed to fetch ${category}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        category,
        parameters: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      });
    }

    // Fetch all parameters
    const allParameters: Record<string, any[]> = {};
    let totalCount = 0;

    for (const table of parameterTables) {
      try {
        let query = supabaseAdmin
          .from(table)
          .select('*')
          .eq('is_active', true)
          .order('usage_count', { ascending: false });

        if (search) {
          query = query.or(`label.ilike.%${search}%,description.ilike.%${search}%`);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          console.error(`Error details for ${table}:`, error.message, error.code, error.details);
          continue; // Skip this table but continue with others
        }

        allParameters[table] = data || [];
        totalCount += count || 0;
      } catch (error) {
        console.error(`Error processing ${table}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      parameters: allParameters,
      categories: parameterTables,
      totalCount,
      pagination: {
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });

  } catch (error) {
    console.error('Cinematic parameters API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const {
      category,
      value,
      label,
      description,
      is_active = true
    } = body;

    // Validate required fields
    if (!category || !value || !label) {
      return NextResponse.json(
        { error: 'Missing required fields: category, value, label' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      'camera_angles', 'lens_types', 'shot_sizes', 'depth_of_field',
      'composition_techniques', 'lighting_styles', 'color_palettes',
      'era_emulations', 'scene_moods', 'camera_movements', 'aspect_ratios',
      'time_settings', 'weather_conditions', 'location_types',
      'foreground_elements', 'subject_counts', 'eye_contacts'
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Check if parameter already exists
    const { data: existingParam } = await supabaseAdmin
      .from(category)
      .select('id')
      .eq('value', value)
      .single();

    if (existingParam) {
      return NextResponse.json(
        { error: 'Parameter with this value already exists' },
        { status: 400 }
      );
    }

    // Create parameter
    const { data: parameter, error } = await supabaseAdmin
      .from(category)
      .insert({
        value,
        label,
        description,
        is_active,
        created_by: 'temp-user-id'
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${category} parameter:`, error);
      return NextResponse.json({ error: `Failed to create ${category} parameter` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      category,
      parameter
    });

  } catch (error) {
    console.error('Create cinematic parameter error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
