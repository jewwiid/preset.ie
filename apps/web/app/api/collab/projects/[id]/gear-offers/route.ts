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

// GET /api/collab/projects/[id]/gear-offers - Get gear offers for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

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
      .select('creator_id')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: gearOffers, error } = await supabase
      .from('collab_gear_offers')
      .select(`
        *,
        offerer:users_profile!collab_gear_offers_offerer_id_fkey(
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
        gear_request:collab_gear_requests(
          id,
          category,
          equipment_spec,
          quantity,
          borrow_preferred,
          max_daily_rate_cents
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
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gear offers:', error);
      return NextResponse.json({ error: 'Failed to fetch gear offers' }, { status: 500 });
    }

    return NextResponse.json({ gearOffers: gearOffers || [] });

  } catch (error) {
    console.error('Get gear offers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects/[id]/gear-offers - Make gear offer for project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const body = await request.json();
    const {
      gear_request_id,
      listing_id,
      offer_type,
      daily_rate_cents,
      total_price_cents,
      message
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

    // Check if project exists and is public
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id, visibility, status')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Don't allow offers to own projects
    if (project.creator_id === profile.id) {
      console.log('❌ Gear offer rejected: User trying to offer to own project', {
        userId: profile.id,
        projectId: id
      });
      return NextResponse.json({
        error: 'Cannot make offers to your own project'
      }, { status: 400 });
    }

    // Don't allow offers to completed or cancelled projects
    if (project.status === 'completed' || project.status === 'cancelled') {
      console.log('❌ Gear offer rejected: Project is completed or cancelled', {
        projectId: id,
        status: project.status
      });
      return NextResponse.json({
        error: 'Cannot make offers to completed or cancelled projects'
      }, { status: 400 });
    }

    // Don't allow offers to draft projects (they should be published first)
    if (project.status === 'draft') {
      console.log('❌ Gear offer rejected: Project is still in draft', {
        projectId: id,
        status: project.status
      });
      return NextResponse.json({
        error: 'Cannot make offers to draft projects. The project must be published first.'
      }, { status: 400 });
    }

    // Validate required fields
    if (!offer_type || !['rent', 'sell', 'borrow'].includes(offer_type)) {
      return NextResponse.json({ 
        error: 'Valid offer_type is required (rent, sell, or borrow)' 
      }, { status: 400 });
    }

    // Validate pricing based on offer type
    if (offer_type === 'rent' || offer_type === 'borrow') {
      if (!daily_rate_cents || daily_rate_cents <= 0) {
        return NextResponse.json({ 
          error: 'Daily rate is required for rent/borrow offers' 
        }, { status: 400 });
      }
    }

    if (offer_type === 'sell') {
      if (!total_price_cents || total_price_cents <= 0) {
        return NextResponse.json({ 
          error: 'Total price is required for sell offers' 
        }, { status: 400 });
      }
    }

    // Check if gear request exists (if provided)
    if (gear_request_id) {
      const { data: gearRequest, error: gearRequestError } = await supabase
        .from('collab_gear_requests')
        .select('id, project_id, status')
        .eq('id', gear_request_id)
        .single();

      if (gearRequestError || !gearRequest) {
        return NextResponse.json({ error: 'Gear request not found' }, { status: 404 });
      }

      if (gearRequest.project_id !== id) {
        return NextResponse.json({ 
          error: 'Gear request does not belong to this project' 
        }, { status: 400 });
      }

      if (gearRequest.status !== 'open') {
        return NextResponse.json({ 
          error: 'Gear request is not open for offers' 
        }, { status: 400 });
      }
    }

    // Check if listing exists and user owns it (if provided)
    if (listing_id) {
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, owner_id, status')
        .eq('id', listing_id)
        .single();

      if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      if (listing.owner_id !== profile.id) {
        return NextResponse.json({ 
          error: 'You can only offer your own listings' 
        }, { status: 403 });
      }

      if (listing.status !== 'active') {
        return NextResponse.json({ 
          error: 'Listing is not active' 
        }, { status: 400 });
      }
    }

    // Check if user already has a pending offer for this project
    const { data: existingOffer, error: existingError } = await supabase
      .from('collab_gear_offers')
      .select('id')
      .eq('project_id', id)
      .eq('offerer_id', profile.id)
      .eq('status', 'pending');

    if (existingError) {
      console.error('Error checking existing offer:', existingError);
      return NextResponse.json({ error: 'Failed to check existing offer' }, { status: 500 });
    }

    if (existingOffer && existingOffer.length > 0) {
      return NextResponse.json({ 
        error: 'You already have a pending offer for this project' 
      }, { status: 400 });
    }

    // Create gear offer
    const insertData: any = {
      project_id: id,
      gear_request_id: gear_request_id || null,
      offerer_id: profile.id,
      listing_id: listing_id || null,
      offer_type,
      message
    };

    // Add pricing based on offer type - only include the relevant field
    if (offer_type === 'rent' || offer_type === 'borrow') {
      insertData.daily_rate_cents = daily_rate_cents;
    } else if (offer_type === 'sell') {
      insertData.total_price_cents = total_price_cents;
    }

    console.log('Creating gear offer with data:', JSON.stringify(insertData, null, 2));

    const { data: gearOffer, error: insertError } = await supabase
      .from('collab_gear_offers')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating gear offer:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json({
        error: 'Failed to create gear offer',
        details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
      }, { status: 500 });
    }

    return NextResponse.json({ gearOffer }, { status: 201 });

  } catch (error) {
    console.error('Create gear offer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
