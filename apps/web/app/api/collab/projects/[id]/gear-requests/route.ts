import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

// GET /api/collab/projects/[id]/gear-requests - Get project gear requests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: gearRequests, error } = await supabase
      .from('collab_gear_requests')
      .select(`
        *,
        offers:collab_gear_offers(
          id,
          offerer_id,
          listing_id,
          offer_type,
          daily_rate_cents,
          total_price_cents,
          message,
          status,
          created_at,
          offerer:users_profile!collab_gear_offers_offerer_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified,
            rating
          ),
          listing:listings(
            id,
            title,
            description,
            category,
            condition,
            rent_day_cents,
            sale_price_cents,
            location_city,
            location_country,
            owner:users_profile!listings_owner_id_fkey(
              id,
              username,
              display_name,
              avatar_url,
              verified
            )
          )
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching gear requests:', error);
      return NextResponse.json({ error: 'Failed to fetch gear requests' }, { status: 500 });
    }

    return NextResponse.json({ gearRequests: gearRequests || [] });

  } catch (error) {
    console.error('Get gear requests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects/[id]/gear-requests - Add gear request to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const body = await request.json();
    const {
      category,
      equipment_spec,
      quantity,
      borrow_preferred,
      retainer_acceptable,
      max_daily_rate_cents
    } = body;

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
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id, status')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Don't allow adding gear requests to completed or cancelled projects
    if (project.status === 'completed' || project.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot add gear requests to completed or cancelled projects' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!category) {
      return NextResponse.json({ 
        error: 'Missing required field: category' 
      }, { status: 400 });
    }

    // Create gear request
    const { data: gearRequest, error: insertError } = await supabase
      .from('collab_gear_requests')
      .insert({
        project_id: id,
        category,
        equipment_spec,
        quantity: quantity || 1,
        borrow_preferred: borrow_preferred !== false, // default to true
        retainer_acceptable: retainer_acceptable || false,
        max_daily_rate_cents
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating gear request:', insertError);
      return NextResponse.json({ error: 'Failed to create gear request' }, { status: 500 });
    }

    return NextResponse.json({ gearRequest }, { status: 201 });

  } catch (error) {
    console.error('Create gear request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
