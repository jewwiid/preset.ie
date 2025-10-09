import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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

// GET /api/gigs/invitations - Get user's gig invitations
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { profile } = await getAuthenticatedUser(supabase, request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'accepted', 'declined', 'expired'
    const type = searchParams.get('type'); // 'received' or 'sent'

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
          status,
          comp_type,
          location_text,
          start_time,
          application_deadline
        )
      `);

    // Filter by type (sent or received)
    if (type === 'sent') {
      query = query.eq('inviter_id', profile.id);
    } else if (type === 'received') {
      query = query.eq('invitee_id', profile.id);
    } else {
      // Default: show both sent and received
      query = query.or(`inviter_id.eq.${profile.id},invitee_id.eq.${profile.id}`);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: invitations, error: invitationsError } = await query;

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

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

