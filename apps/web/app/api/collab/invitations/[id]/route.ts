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

// PATCH /api/collab/invitations/[id] - Accept, decline, or cancel invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: invitationId } = await params;
    const body = await request.json();
    const { action } = body; // 'accept', 'decline', or 'cancel'

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

    // Validate action
    if (!['accept', 'decline', 'cancel'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "accept", "decline", or "cancel"' 
      }, { status: 400 });
    }

    // Fetch invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('collab_invitations')
      .select('*, project:collab_projects(id, creator_id, title)')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify user has permission
    if (action === 'cancel') {
      // Only inviter or project creator can cancel
      if (invitation.inviter_id !== profile.id && invitation.project.creator_id !== profile.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // Only invitee can accept or decline
      if (invitation.invitee_id !== profile.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Check invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: `Invitation has already been ${invitation.status}` 
      }, { status: 409 });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('collab_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);
      
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 410 });
    }

    // Determine new status
    let newStatus: string;
    switch (action) {
      case 'accept':
        newStatus = 'accepted';
        break;
      case 'decline':
        newStatus = 'declined';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update invitation
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('collab_invitations')
      .update({ status: newStatus })
      .eq('id', invitationId)
      .select(`
        *,
        project:collab_projects(
          id,
          title,
          description,
          creator:users_profile!collab_projects_creator_id_fkey(
            id,
            handle,
            display_name,
            avatar_url
          )
        ),
        inviter:users_profile!collab_invitations_inviter_id_fkey(
          id,
          handle,
          display_name,
          avatar_url
        ),
        invitee:users_profile!collab_invitations_invitee_id_fkey(
          id,
          handle,
          display_name,
          avatar_url
        ),
        role:collab_roles(
          id,
          role_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
    }

    // TODO: Send notification to inviter when invitation is accepted/declined
    // This will be implemented in the notifications integration step

    return NextResponse.json({ 
      invitation: updatedInvitation,
      message: `Invitation ${newStatus} successfully`
    });

  } catch (error) {
    console.error('Update invitation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/collab/invitations/[id] - Delete/revoke invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: invitationId } = await params;

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

    // Fetch invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('collab_invitations')
      .select('*, project:collab_projects(id, creator_id)')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify user has permission (only inviter or project creator can delete)
    if (invitation.inviter_id !== profile.id && invitation.project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('collab_invitations')
      .delete()
      .eq('id', invitationId);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Invitation deleted successfully' 
    });

  } catch (error) {
    console.error('Delete invitation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
