import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/collab/projects/[id]/roles - Get project roles
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: roles, error } = await supabase
      .from('collab_roles')
      .select(`
        *,
        applications:collab_applications(
          id,
          applicant_id,
          message,
          portfolio_url,
          status,
          created_at,
          applicant:users_profile!collab_applications_applicant_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified,
            rating
          )
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    return NextResponse.json({ roles: roles || [] });

  } catch (error) {
    console.error('Get roles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects/[id]/roles - Add role to project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      role_name,
      skills_required,
      is_paid,
      compensation_details,
      headcount
    } = body;

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user owns the project
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id, status')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Don't allow adding roles to completed or cancelled projects
    if (project.status === 'completed' || project.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot add roles to completed or cancelled projects' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!role_name) {
      return NextResponse.json({ 
        error: 'Missing required field: role_name' 
      }, { status: 400 });
    }

    // Create role
    const { data: role, error: insertError } = await supabase
      .from('collab_roles')
      .insert({
        project_id: id,
        role_name,
        skills_required: skills_required || [],
        is_paid: is_paid || false,
        compensation_details,
        headcount: headcount || 1
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating role:', insertError);
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }

    return NextResponse.json({ role }, { status: 201 });

  } catch (error) {
    console.error('Create role API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
