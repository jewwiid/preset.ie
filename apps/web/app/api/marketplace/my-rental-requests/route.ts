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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    // Get user from Authorization header
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
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch rental requests for this user
    const { data: rentalRequests, error } = await supabase
      .from('rental_requests')
      .select(`
        *,
        listing:listings (
          id,
          title,
          category,
          listing_images (
            id,
            url,
            alt_text
          )
        ),
        owner:users_profile (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('requester_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rental requests:', error);
      return NextResponse.json({ error: 'Failed to fetch rental requests' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rental_requests: rentalRequests
    });

  } catch (error: any) {
    console.error('My rental requests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
