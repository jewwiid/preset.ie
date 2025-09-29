import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

// GET /api/collab/projects/[id] - Get single project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: projectId } = await params;

    // Get current user if authenticated
    const authHeader = request.headers.get('authorization');
    let currentUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          currentUserId = profile.id;
        }
      }
    }

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
          role_type,
          status,
          joined_at,
          user:users_profile!collab_participants_user_id_fkey(
            id,
            handle,
            display_name,
            avatar_url,
            verified_id,
            rating
          )
        ),
        moodboard:moodboards(
          id,
          title,
          description,
          moodboard_items(
            id,
            image_url,
            description,
            sort_order
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to this project
    const hasAccess = 
      project.visibility === 'public' ||
      currentUserId === project.creator_id ||
      project.collab_participants.some((p: any) => p.user_id === currentUserId) ||
      (currentUserId && await checkInvitationAccess(supabase, projectId, currentUserId));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get invitation statistics for project creator
    let invitationStats = null;
    if (currentUserId === project.creator_id) {
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
      isCreator: currentUserId === project.creator_id
    });

  } catch (error) {
    console.error('Project details API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check invitation access
async function checkInvitationAccess(supabase: any, projectId: string, userId: string): Promise<boolean> {
  const { data: invitation } = await supabase
    .from('collab_invitations')
    .select('status')
    .eq('project_id', projectId)
    .eq('invitee_id', userId)
    .in('status', ['pending', 'accepted'])
    .single();

  return !!invitation;
}

// PATCH /api/collab/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: projectId } = await params;
    const body = await request.json();

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

    // Verify user is the project creator
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Only project creators can update projects' }, { status: 403 });
    }

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from('collab_projects')
      .update(body)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating project:', updateError);
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
    const supabase = getSupabaseClient();
    const { id: projectId } = await params;

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

    // Verify user is the project creator
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Only project creators can delete projects' }, { status: 403 });
    }

    // Delete project (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('collab_projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Delete project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}