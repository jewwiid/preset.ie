import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET /api/marketplace/listings/[id]/availability - Get availability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query
    let query = supabase
      .from('listing_availability')
      .select('*')
      .eq('listing_id', id)
      .order('start_date', { ascending: true });

    // Filter by date range if provided
    if (startDate && endDate) {
      query = query.or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);
    }

    const { data: availability, error } = await query;

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    return NextResponse.json({ availability: availability || [] });

  } catch (error) {
    console.error('Get availability API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/marketplace/listings/[id]/availability - Set blackout dates
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await params;
    const body = await request.json();
    const { start_date, end_date, notes } = body;

    // Validate required fields
    if (!start_date || !end_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: start_date, end_date' 
      }, { status: 400 });
    }

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }

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

    // Check if user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check for overlapping availability blocks
    const { data: overlapping, error: overlapError } = await supabase
      .from('listing_availability')
      .select('id')
      .eq('listing_id', id)
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (overlapError) {
      console.error('Error checking overlapping availability:', overlapError);
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json({ 
        error: 'Date range overlaps with existing availability block' 
      }, { status: 400 });
    }

    // Create availability block
    const { data: availability, error: insertError } = await supabase
      .from('listing_availability')
      .insert({
        listing_id: id,
        start_date,
        end_date,
        kind: 'blackout',
        notes: notes || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating availability block:', insertError);
      return NextResponse.json({ error: 'Failed to create availability block' }, { status: 500 });
    }

    return NextResponse.json({ availability }, { status: 201 });

  } catch (error) {
    console.error('Create availability API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/marketplace/listings/[id]/availability/[blockId] - Remove availability block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ error: 'Block ID required' }, { status: 400 });
    }

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

    // Get availability block
    const { data: availability, error: availabilityError } = await supabase
      .from('listing_availability')
      .select(`
        *,
        listing:listings!listing_availability_listing_id_fkey(
          owner_id
        )
      `)
      .eq('id', blockId)
      .single();

    if (availabilityError || !availability) {
      return NextResponse.json({ error: 'Availability block not found' }, { status: 404 });
    }

    // Check if user owns the listing
    if (availability.listing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow deletion of blackout blocks (not reservations)
    if (availability.kind !== 'blackout') {
      return NextResponse.json({ 
        error: 'Cannot delete reservation blocks' 
      }, { status: 400 });
    }

    // Delete availability block
    const { error: deleteError } = await supabase
      .from('listing_availability')
      .delete()
      .eq('id', blockId);

    if (deleteError) {
      console.error('Error deleting availability block:', deleteError);
      return NextResponse.json({ error: 'Failed to delete availability block' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Availability block deleted successfully' });

  } catch (error) {
    console.error('Delete availability API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
