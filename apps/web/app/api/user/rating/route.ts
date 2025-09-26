import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/user/rating - Get current user's rating
export async function GET(request: NextRequest) {
  try {
    // Get user from session
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
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }

    // Get user rating info
    const { data: ratingData, error: ratingError } = await supabase
      .rpc('get_user_rating_info', { user_id: userProfile.id });

    if (ratingError) {
      console.error('Error fetching user rating:', ratingError);
      return NextResponse.json({ 
        error: 'Failed to fetch user rating' 
      }, { status: 500 });
    }

    const ratingInfo = ratingData?.[0] || { average_rating: 0.0, total_reviews: 0 };

    return NextResponse.json({ 
      average_rating: ratingInfo.average_rating,
      total_reviews: ratingInfo.total_reviews,
      user_id: userProfile.id
    });

  } catch (error: any) {
    console.error('User rating API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
