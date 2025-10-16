import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/user-rating?userId=X - Get public user rating by profile ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    // Get user rating info (public endpoint)
    const { data: ratingData, error: ratingError } = await supabase
      .rpc('get_user_rating_info', { user_id: userId });

    if (ratingError) {
      console.error('Error fetching user rating:', ratingError);
      // Return default values if rating info not found
      return NextResponse.json({
        average_rating: 0.0,
        total_reviews: 0
      });
    }

    const ratingInfo = ratingData?.[0] || { average_rating: 0.0, total_reviews: 0 };

    return NextResponse.json({
      average_rating: ratingInfo.average_rating,
      total_reviews: ratingInfo.total_reviews
    });

  } catch (error: any) {
    console.error('Public user rating API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}