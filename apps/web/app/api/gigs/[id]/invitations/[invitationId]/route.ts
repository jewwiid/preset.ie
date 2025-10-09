import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const InvitationActionSchema = z.object({
  action: z.enum(['accept', 'decline'])
});

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

// Helper function to get authenticated user
async function getAuthenticatedUser(supabase: any, request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Authentication required');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    throw new Error('Invalid authentication');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users_profile')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return { user, profile };
}

// PATCH /api/gigs/[id]/invitations/[invitationId] - Accept or decline invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: gigId, invitationId } = await params;

    // Validate UUIDs
    if (!z.string().uuid().safeParse(gigId).success || !z.string().uuid().safeParse(invitationId).success) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const { profile } = await getAuthenticatedUser(supabase, request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = InvitationActionSchema.parse(body);

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('gig_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('gig_id', gigId)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if user is the invitee
    if (invitation.invitee_id !== profile.id) {
      return NextResponse.json({ 
        error: 'You can only respond to invitations sent to you' 
      }, { status: 403 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: `This invitation has already been ${invitation.status}` 
      }, { status: 400 });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 400 });
    }

    // Update invitation status
    const newStatus = validatedData.action === 'accept' ? 'accepted' : 'declined';
    
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('gig_invitations')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select(`
        *,
        inviter:users_profile!gig_invitations_inviter_id_fkey(
          id,
          handle,
          display_name,
          avatar_url
        ),
        invitee:users_profile!gig_invitations_invitee_id_fkey(
          id,
          handle,
          display_name,
          avatar_url,
          primary_skill
        ),
        gig:gigs(
          id,
          title,
          status
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
    }

    // Note: Application creation is handled by the database trigger
    // The trigger automatically creates a PENDING application when invitation is accepted

    // TODO: Send notification to inviter about response
    // This will be implemented in the notifications integration step

    return NextResponse.json({ 
      invitation: updatedInvitation,
      message: `Invitation ${newStatus} successfully`
    });

  } catch (error: any) {
    console.error('Update invitation API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

