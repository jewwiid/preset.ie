import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { getUserFromRequest } from '../../../lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const format = searchParams.get('format');
    const status = searchParams.get('status');

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    let query = supabase
      .from('treatments')
      .select(`
        *,
        gigs (
          id,
          title,
          status
        ),
        moodboards (
          id,
          title
        )
      `)
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (format) {
      query = query.eq('format', format);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: treatments, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching treatments:', error);
      return NextResponse.json({ error: 'Failed to fetch treatments' }, { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('treatments')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    return NextResponse.json({
      treatments: treatments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in treatments GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, format, theme, sections, loglines, cta_suggestions, project_id, moodboard_id } = body;

    if (!title || !format) {
      return NextResponse.json(
        { error: 'Title and format are required' },
        { status: 400 }
      );
    }

    // Create treatment
    const { data: treatment, error } = await supabase
      .from('treatments')
      .insert({
        owner_id: user.id,
        title,
        format,
        theme,
        json_content: {
          sections: sections || [],
          loglines: loglines || [],
          cta_suggestions: cta_suggestions || []
        },
        project_id: project_id || null,
        moodboard_id: moodboard_id || null,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating treatment:', error);
      return NextResponse.json({ error: 'Failed to create treatment' }, { status: 500 });
    }

    // Create initial version
    await supabase
      .from('treatment_versions')
      .insert({
        treatment_id: treatment.id,
        version_number: 1,
        json_content: treatment.json_content,
        change_summary: 'Initial version',
        created_by: user.id
      });

    return NextResponse.json(treatment);

  } catch (error) {
    console.error('Error in treatments POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
