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

// GET /api/gigs - List gigs with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const owner = searchParams.get('owner'); // 'me' for current user's gigs
    const status = searchParams.get('status'); // Comma-separated statuses
    const limit = parseInt(searchParams.get('limit') || '50');

    // If filtering by owner=me, require authentication
    if (owner === 'me') {
      const { profile } = await getAuthenticatedUser(supabase, request);

      // Build query for user's gigs
      let query = supabase
        .from('gigs')
        .select(`
          id,
          title,
          description,
          comp_type,
          location_text,
          city,
          country,
          start_time,
          end_time,
          application_deadline,
          max_applicants,
          status,
          created_at
        `)
        .eq('owner_user_id', profile.id);

      // Filter by status if provided
      if (status) {
        const statuses = status.split(',').map(s => s.trim());
        query = query.in('status', statuses);
      }

      // For invitations, we want to include gigs even if deadline passed
      // (invitations are different from applications)

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      // Apply limit
      query = query.limit(limit);

      const { data: gigs, error: gigsError } = await query;

      if (gigsError) {
        console.error('Error fetching gigs:', gigsError);
        return NextResponse.json({ error: 'Failed to fetch gigs' }, { status: 500 });
      }

      return NextResponse.json({ gigs: gigs || [] });
    }

    // Public gig listing (not implemented for now)
    return NextResponse.json({ 
      error: 'Public gig listing not implemented. Use owner=me to fetch your gigs.' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Get gigs API error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

