import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// GET /api/collab/projects/[id]/applications - Get project applications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      .select('creator_id')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: applications, error } = await supabase
      .from('collab_applications')
      .select(`
        *,
        applicant:users_profile!collab_applications_applicant_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          verified,
          rating,
          city,
          country,
          bio,
          specializations
        ),
        role:collab_roles(
          id,
          role_name,
          skills_required,
          is_paid,
          compensation_details,
          headcount,
          status
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({ applications: applications || [] });

  } catch (error) {
    console.error('Get applications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects/[id]/applications - Apply for project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      role_id,
      application_type,
      message,
      portfolio_url
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

    // Check if project exists and is public
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id, visibility, status')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Don't allow applications to own projects
    if (project.creator_id === profile.id) {
      return NextResponse.json({ 
        error: 'Cannot apply to your own project' 
      }, { status: 400 });
    }

    // Don't allow applications to completed or cancelled projects
    if (project.status === 'completed' || project.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot apply to completed or cancelled projects' 
      }, { status: 400 });
    }

    // Validate application type and role_id
    if (application_type === 'role' && !role_id) {
      return NextResponse.json({ 
        error: 'role_id is required for role applications' 
      }, { status: 400 });
    }

    if (application_type === 'general' && role_id) {
      return NextResponse.json({ 
        error: 'role_id should not be provided for general applications' 
      }, { status: 400 });
    }

    // Check if role exists and is open (for role applications)
    if (application_type === 'role' && role_id) {
      const { data: role, error: roleError } = await supabase
        .from('collab_roles')
        .select('id, status, project_id')
        .eq('id', role_id)
        .single();

      if (roleError || !role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }

      if (role.project_id !== id) {
        return NextResponse.json({ 
          error: 'Role does not belong to this project' 
        }, { status: 400 });
      }

      if (role.status !== 'open') {
        return NextResponse.json({ 
          error: 'Role is not open for applications' 
        }, { status: 400 });
      }
    }

    // Check if user already has an application for this project
    const { data: existingApplication, error: existingError } = await supabase
      .from('collab_applications')
      .select('id')
      .eq('project_id', id)
      .eq('applicant_id', profile.id)
      .eq('status', 'pending');

    if (existingError) {
      console.error('Error checking existing application:', existingError);
      return NextResponse.json({ error: 'Failed to check existing application' }, { status: 500 });
    }

    if (existingApplication && existingApplication.length > 0) {
      return NextResponse.json({ 
        error: 'You already have a pending application for this project' 
      }, { status: 400 });
    }

    // Create application
    const { data: application, error: insertError } = await supabase
      .from('collab_applications')
      .insert({
        project_id: id,
        role_id: application_type === 'role' ? role_id : null,
        applicant_id: profile.id,
        application_type,
        message,
        portfolio_url
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application:', insertError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });

  } catch (error) {
    console.error('Create application API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
