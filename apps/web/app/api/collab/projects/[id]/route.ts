import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/collab/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: project, error } = await supabase
      .from('collab_projects')
      .select(`
        *,
        creator:users_profile!collab_projects_creator_id_fkey(
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
            username,
            display_name,
            avatar_url,
            verified,
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check visibility permissions
    if (project.visibility !== 'public') {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          const { data: profile } = await supabase
            .from('users_profile')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (profile && (
            profile.id === project.creator_id ||
            project.collab_participants.some((p: any) => p.user_id === profile.id)
          )) {
            return NextResponse.json({ project });
          }
        }
      }
      
      return NextResponse.json({ error: 'Project not available' }, { status: 404 });
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Get project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/collab/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('collab_projects')
      .select('creator_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Don't allow updates to completed or cancelled projects
    if (existingProject.status === 'completed' || existingProject.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot update completed or cancelled projects' 
      }, { status: 400 });
    }

    // Update project
    const { data: project, error: updateError } = await supabase
      .from('collab_projects')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating project:', updateError);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ project });

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
    const { data: existingProject, error: fetchError } = await supabase
      .from('collab_projects')
      .select('creator_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if project has active participants (other than creator)
    const { data: activeParticipants, error: participantsError } = await supabase
      .from('collab_participants')
      .select('id')
      .eq('project_id', id)
      .neq('user_id', profile.id)
      .eq('status', 'active');

    if (participantsError) {
      console.error('Error checking participants:', participantsError);
      return NextResponse.json({ error: 'Failed to check participants' }, { status: 500 });
    }

    if (activeParticipants && activeParticipants.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete project with active participants' 
      }, { status: 400 });
    }

    // Delete project (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('collab_projects')
      .delete()
      .eq('id', id);

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
