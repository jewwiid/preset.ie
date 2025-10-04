import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schemas
const InvitationSchema = z.object({
  invitee_id: z.string().uuid().optional(),
  invitee_email: z.string().email().optional(),
  role_id: z.string().uuid().optional(),
  message: z.string().max(1000).optional(),
  expires_in_days: z.number().min(1).max(365).optional()
}).refine(
  (data) => data.invitee_id || data.invitee_email,
  {
    message: "Either invitee_id or invitee_email is required",
    path: ["invitee_id"]
  }
);

const InvitationActionSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel'])
});

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
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
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return { user, profile };
}

// Helper function to validate project access
async function validateProjectAccess(supabase: any, projectId: string, userId: string, requireCreator = false) {
  const { data: project, error: projectError } = await supabase
    .from('collab_projects')
    .select('creator_id, title')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  if (requireCreator && project.creator_id !== userId) {
    throw new Error('Only project creators can perform this action');
  }

  return project;
}

// GET /api/collab/projects/[id]/invitations - List project invitations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: projectId } = await params;

    // Validate project ID
    if (!projectId || !z.string().uuid().safeParse(projectId).success) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { profile } = await getAuthenticatedUser(supabase, request);
    await validateProjectAccess(supabase, projectId, profile.id, true);

    // Fetch invitations with related data
    const { data: invitations, error: invitationsError } = await supabase
      .from('collab_invitations')
      .select(`
        *,
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
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations });

  } catch (error: any) {
    console.error('Invitations API error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (error.message === 'Project not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Only project creators can perform this action') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects/[id]/invitations - Send invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: projectId } = await params;

    // Validate project ID
    if (!projectId || !z.string().uuid().safeParse(projectId).success) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { profile } = await getAuthenticatedUser(supabase, request);
    
    // Rate limiting
    if (!checkRateLimit(`invite:${profile.id}`, 20, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    const project = await validateProjectAccess(supabase, projectId, profile.id, true);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = InvitationSchema.parse(body);

    // Check if invitee accepts collaboration invitations (privacy check)
    if (validatedData.invitee_id) {
      const { data: inviteeProfile, error: inviteeError } = await supabase
        .from('users_profile')
        .select('allow_collaboration_invites')
        .eq('id', validatedData.invitee_id)
        .single();

      if (inviteeError || !inviteeProfile) {
        return NextResponse.json({
          error: 'User not found'
        }, { status: 404 });
      }

      if (inviteeProfile.allow_collaboration_invites === false) {
        return NextResponse.json({
          error: 'This user has disabled collaboration invitations in their privacy settings'
        }, { status: 403 });
      }
    }

    // Check if invitation already exists
    const existingQuery = supabase
      .from('collab_invitations')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('status', 'pending');

    if (validatedData.invitee_id) {
      existingQuery.eq('invitee_id', validatedData.invitee_id);
    } else {
      existingQuery.eq('invitee_email', validatedData.invitee_email);
    }

    const { data: existingInvitation } = await existingQuery.single();

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'An active invitation already exists for this user' 
      }, { status: 409 });
    }

    // Validate role exists if provided
    if (validatedData.role_id) {
      const { data: role, error: roleError } = await supabase
        .from('collab_roles')
        .select('id')
        .eq('id', validatedData.role_id)
        .eq('project_id', projectId)
        .single();

      if (roleError || !role) {
        return NextResponse.json({ 
          error: 'Invalid role ID or role does not belong to this project' 
        }, { status: 400 });
      }
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (validatedData.expires_in_days || 30));

    // Create invitation
    const { data: invitation, error: insertError } = await supabase
      .from('collab_invitations')
      .insert({
        project_id: projectId,
        inviter_id: profile.id,
        invitee_id: validatedData.invitee_id || null,
        invitee_email: validatedData.invitee_email || null,
        role_id: validatedData.role_id || null,
        message: validatedData.message || null,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select(`
        *,
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

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // TODO: Send notification/email to invitee
    // This will be implemented in the notifications integration step

    return NextResponse.json({ invitation }, { status: 201 });

  } catch (error: any) {
    console.error('Create invitation API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (error.message === 'Project not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Only project creators can perform this action') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}