import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const GigInvitationSchema = z.object({
  invitee_id: z.string().uuid(),
  message: z.string().max(1000).optional(),
});

const InvitationActionSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel'])
});

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

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
    .select('id, role_flags')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return { user, profile };
}

// Helper function to validate gig access
async function validateGigAccess(supabase: any, gigId: string, userId: string, requireOwner = false) {
  const { data: gig, error: gigError } = await supabase
    .from('gigs')
    .select('owner_user_id, title, status, application_deadline')
    .eq('id', gigId)
    .single();

  if (gigError || !gig) {
    throw new Error('Gig not found');
  }

  if (requireOwner && gig.owner_user_id !== userId) {
    throw new Error('Only gig owners can perform this action');
  }

  return gig;
}

// GET /api/gigs/[id]/invitations - List gig invitations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: gigId } = await params;

    // Validate gig ID
    if (!gigId || !z.string().uuid().safeParse(gigId).success) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 });
    }

    const { profile } = await getAuthenticatedUser(supabase, request);
    await validateGigAccess(supabase, gigId, profile.id, true);

    // Check if filtering by invitee_id
    const { searchParams } = new URL(request.url);
    const inviteeId = searchParams.get('invitee_id');

    // Build query
    let query = supabase
      .from('gig_invitations')
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
      .eq('gig_id', gigId);

    // Apply invitee filter if provided
    if (inviteeId) {
      query = query.eq('invitee_id', inviteeId);
    }

    const { data: invitations, error: invitationsError } = await query
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching gig invitations:', invitationsError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations: invitations || [] });

  } catch (error: any) {
    console.error('Get gig invitations API error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (error.message === 'Gig not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Only gig owners can perform this action') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/gigs/[id]/invitations - Send invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: gigId } = await params;

    // Validate gig ID
    if (!gigId || !z.string().uuid().safeParse(gigId).success) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 });
    }

    const { profile } = await getAuthenticatedUser(supabase, request);
    
    // Check if user is a CONTRIBUTOR (only contributors can create gigs and send invitations)
    const isContributor = profile.role_flags?.includes('CONTRIBUTOR') || profile.role_flags?.includes('BOTH');
    if (!isContributor) {
      return NextResponse.json({ 
        error: 'Only contributors can send gig invitations' 
      }, { status: 403 });
    }
    
    // Rate limiting: 20 invitations per minute
    if (!checkRateLimit(`gig-invite:${profile.id}`, 20, 60000)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }

    const gig = await validateGigAccess(supabase, gigId, profile.id, true);

    // Check if gig is in a valid state for invitations
    if (!['DRAFT', 'PUBLISHED'].includes(gig.status)) {
      return NextResponse.json({
        error: 'Cannot send invitations for this gig status'
      }, { status: 400 });
    }

    // Check if application deadline has passed
    if (gig.application_deadline && new Date(gig.application_deadline) < new Date()) {
      return NextResponse.json({
        error: 'Cannot send invitations - application deadline has passed'
      }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = GigInvitationSchema.parse(body);

    // Check if invitee is TALENT
    const { data: inviteeProfile, error: inviteeError } = await supabase
      .from('users_profile')
      .select('id, role_flags, allow_gig_invites')
      .eq('id', validatedData.invitee_id)
      .single();

    if (inviteeError || !inviteeProfile) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    const isTalent = inviteeProfile.role_flags?.includes('TALENT') || inviteeProfile.role_flags?.includes('BOTH');
    if (!isTalent) {
      return NextResponse.json({
        error: 'Can only invite talent users to gigs'
      }, { status: 400 });
    }

    // Check privacy settings for gig invitations
    if (inviteeProfile.allow_gig_invites === false) {
      return NextResponse.json({
        error: 'This user has disabled gig invitations in their privacy settings'
      }, { status: 403 });
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('gig_invitations')
      .select('id, status')
      .eq('gig_id', gigId)
      .eq('invitee_id', validatedData.invitee_id)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'An active invitation already exists for this user' 
      }, { status: 409 });
    }

    // Check if user already applied
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('gig_id', gigId)
      .eq('applicant_user_id', validatedData.invitee_id)
      .single();

    if (existingApplication) {
      return NextResponse.json({
        error: 'User has already applied to this gig'
      }, { status: 409 });
    }

    // Calculate expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation (bypass RLS with service role)
    const insertData = {
      gig_id: gigId,
      inviter_id: profile.id,
      invitee_id: validatedData.invitee_id,
      message: validatedData.message || null,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    };
    
    console.log('Attempting to insert gig invitation:', insertData);
    
    const { data: invitation, error: insertError } = await supabase
      .from('gig_invitations')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating gig invitation:', insertError);
      console.error('Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json({ 
        error: 'Failed to create invitation',
        details: insertError.message 
      }, { status: 500 });
    }

    // TODO: Send notification to invitee

    return NextResponse.json({ invitation }, { status: 201 });

  } catch (error: any) {
    console.error('Create gig invitation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.issues 
      }, { status: 400 });
    }
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (error.message === 'Gig not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Only gig owners can perform this action') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/gigs/[id]/invitations - Respond to invitation (accept/decline/cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: invitationId } = await params;

    // Validate invitation ID
    if (!invitationId || !z.string().uuid().safeParse(invitationId).success) {
      return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
    }

    const { profile } = await getAuthenticatedUser(supabase, request);

    // Parse request body
    const body = await request.json();
    const { action } = InvitationActionSchema.parse(body);

    // Fetch the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('gig_invitations')
      .select('*, gig:gigs(title, owner_user_id)')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Validate permissions
    if (action === 'cancel') {
      // Only inviter can cancel
      if (invitation.inviter_id !== profile.id) {
        return NextResponse.json({ 
          error: 'Only the inviter can cancel this invitation' 
        }, { status: 403 });
      }
    } else {
      // Only invitee can accept/decline
      if (invitation.invitee_id !== profile.id) {
        return NextResponse.json({ 
          error: 'Only the invitee can respond to this invitation' 
        }, { status: 403 });
      }
    }

    // Check if already responded
    if (invitation.status !== 'pending') {
      return NextResponse.json({
        error: `Invitation has already been ${invitation.status}`
      }, { status: 400 });
    }

    // Update invitation status
    const newStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'cancelled';
    
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('gig_invitations')
      .update({ 
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gig invitation:', updateError);
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
    }

    // If accepted, the trigger will auto-create the application
    // TODO: Send notification to inviter about response

    return NextResponse.json({ 
      invitation: updatedInvitation,
      message: `Invitation ${newStatus} successfully`
    });

  } catch (error: any) {
    console.error('Respond to gig invitation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.issues 
      }, { status: 400 });
    }
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

