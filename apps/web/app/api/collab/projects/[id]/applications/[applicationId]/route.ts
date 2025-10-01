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

// GET /api/collab/projects/[id]/applications/[applicationId] - Get single application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: projectId, applicationId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClient(token, true);

    // Get current user
    const authClient = getSupabaseClient(token, false);
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Get application with full details
    const { data: application, error: appError } = await supabase
      .from('collab_applications')
      .select(`
        *,
        applicant:users_profile!collab_applications_applicant_id_fkey(
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
        role:collab_roles(
          id,
          role_name,
          skills_required,
          is_paid,
          compensation_details
        ),
        project:collab_projects!collab_applications_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', applicationId)
      .eq('project_id', projectId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check access: creator or applicant can view
    const isCreator = application.project.creator_id === profile.id;
    const isApplicant = application.applicant_id === profile.id;

    if (!isCreator && !isApplicant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ application });

  } catch (error) {
    console.error('Get application API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/collab/projects/[id]/applications/[applicationId] - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: projectId, applicationId } = await params;
    const body = await request.json();
    const { status: newStatus, rejection_reason } = body;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClient(token, true);

    // Get current user
    const authClient = getSupabaseClient(token, false);
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Validate status
    if (!['accepted', 'rejected', 'withdrawn'].includes(newStatus)) {
      return NextResponse.json({
        error: 'Invalid status. Must be: accepted, rejected, or withdrawn'
      }, { status: 400 });
    }

    // Get application with project info
    const { data: application, error: appError } = await supabase
      .from('collab_applications')
      .select(`
        *,
        project:collab_projects!collab_applications_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', applicationId)
      .eq('project_id', projectId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if application is still pending
    if (application.status !== 'pending') {
      return NextResponse.json({
        error: `Cannot modify application with status: ${application.status}`
      }, { status: 400 });
    }

    const isCreator = application.project.creator_id === profile.id;
    const isApplicant = application.applicant_id === profile.id;

    // Authorization checks
    if (newStatus === 'withdrawn') {
      // Only applicant can withdraw
      if (!isApplicant) {
        return NextResponse.json({
          error: 'Only the applicant can withdraw this application'
        }, { status: 403 });
      }
    } else if (newStatus === 'accepted' || newStatus === 'rejected') {
      // Only creator can accept/reject
      if (!isCreator) {
        return NextResponse.json({
          error: 'Only the project creator can accept or reject applications'
        }, { status: 403 });
      }
    }

    // Update application
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from('collab_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // If accepted, add applicant as participant
    if (newStatus === 'accepted') {
      // Check if participant already exists
      const { data: existingParticipant } = await supabase
        .from('collab_participants')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', application.applicant_id)
        .single();

      if (!existingParticipant) {
        await supabase
          .from('collab_participants')
          .insert({
            project_id: projectId,
            user_id: application.applicant_id,
            role_type: 'collaborator',
            role_id: application.role_id,
            status: 'active'
          });
      }
    }

    return NextResponse.json({ application: updatedApplication });

  } catch (error) {
    console.error('Update application API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
