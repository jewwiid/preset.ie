import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Supabase client
const getSupabaseClient = (authToken?: string, useServiceRole = false) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (useServiceRole) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase service role environment variables');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`
      } : {}
    }
  });

  return client;
};

// GET /api/collab/projects/[id] - Get single project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Use service role client for reliable access
    const supabase = getSupabaseClient(token, true);

    // Fetch project with all related data
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select(`
        *,
        creator:users_profile!collab_projects_creator_id_fkey(
          id,
          handle,
          display_name,
          avatar_url,
          verified_id,
          city,
          country,
          bio,
          specializations
        ),
        collab_roles(
          id,
          role_name,
          skills_required,
          is_paid,
          compensation_details,
          headcount,
          status,
          created_at
        ),
        collab_gear_requests(
          id,
          category,
          equipment_spec,
          quantity,
          borrow_preferred,
          retainer_acceptable,
          max_daily_rate_cents,
          status,
          created_at
        ),
        collab_participants(
          id,
          user_id,
          role_type,
          role_id,
          status,
          joined_at,
          user:users_profile!collab_participants_user_id_fkey(
            id,
            handle,
            display_name,
            avatar_url,
            verified_id
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json({ error: 'Project not found', details: projectError.message }, { status: 404 });
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Ensure arrays exist even if relations are empty
    project.collab_roles = project.collab_roles || [];
    project.collab_gear_requests = project.collab_gear_requests || [];
    project.collab_participants = project.collab_participants || [];

    // Get current user info for additional data
    let currentUserId: string | null = null;
    let isCreator = false;
    
    if (token) {
      // Create a separate authenticated client to get user info
      const authClient = getSupabaseClient(token, false);
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        const { data: profile } = await authClient
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          currentUserId = profile.id;
          isCreator = currentUserId === project.creator_id;
        }
      }
    }

    // Manual access control since we're using service role
    const hasAccess = 
      project.visibility === 'public' ||
      isCreator;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get invitation statistics for project creator
    let invitationStats = null;
    if (isCreator) {
      const { data: stats } = await supabase
        .from('collab_invitations')
        .select('status')
        .eq('project_id', projectId);
      
      invitationStats = {
        pending: stats?.filter(s => s.status === 'pending').length || 0,
        accepted: stats?.filter(s => s.status === 'accepted').length || 0,
        declined: stats?.filter(s => s.status === 'declined').length || 0,
        total: stats?.length || 0
      };
    }

    return NextResponse.json({ 
      project,
      invitationStats,
      isCreator
    });

  } catch (error) {
    console.error('Project details API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// PATCH /api/collab/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Use service role client for reliable access
    const supabase = getSupabaseClient(token, true);

    // Get current user info for access control
    let currentUserId: string | null = null;
    let isCreator = false;
    
    if (token) {
      // Create a separate authenticated client to get user info
      const authClient = getSupabaseClient(token, false);
      const { data: { user }, error: userError } = await authClient.auth.getUser();
      console.log('Auth user:', user?.id, 'Error:', userError);
      if (user) {
        const { data: profile, error: profileError } = await authClient
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();

        console.log('User profile:', profile, 'Error:', profileError);
        if (profile) {
          currentUserId = profile.id;
        } else {
          console.error('No profile found for user:', user.id);
          return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
        }
      } else {
        console.error('No user found with token');
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }

    // First, check if project exists and get creator info
    const { data: existingProject, error: fetchError } = await supabase
      .from('collab_projects')
      .select('creator_id')
      .eq('id', projectId)
      .single();

    console.log('Existing project:', existingProject);
    console.log('Current user ID:', currentUserId);
    console.log('Project creator ID:', existingProject?.creator_id);

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is the creator
    isCreator = currentUserId === existingProject.creator_id;
    console.log('Is creator:', isCreator);
    
    if (!isCreator) {
      return NextResponse.json({ error: 'Access denied - only project creator can update' }, { status: 403 });
    }

    // Update project - now we know user has permission
    const { data: updatedProject, error: updateError } = await supabase
      .from('collab_projects')
      .update(body)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating project:', updateError);
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ project: updatedProject });

  } catch (error) {
    console.error('Update project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/collab/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Use service role client for reliable access
    const supabase = getSupabaseClient(token, true);

    // Get current user info for access control
    let currentUserId: string | null = null;
    
    if (token) {
      // Create a separate authenticated client to get user info
      const authClient = getSupabaseClient(token, false);
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        const { data: profile } = await authClient
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          currentUserId = profile.id;
        }
      }
    }

    // First, check if project exists and get creator info
    const { data: existingProject, error: fetchError } = await supabase
      .from('collab_projects')
      .select('creator_id')
      .eq('id', projectId)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is the creator
    const isCreator = currentUserId === existingProject.creator_id;
    
    if (!isCreator) {
      return NextResponse.json({ error: 'Access denied - only project creator can delete' }, { status: 403 });
    }

    // Delete project - now we know user has permission
    const { error: deleteError } = await supabase
      .from('collab_projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Delete project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}