import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/reviews - Get reviews for a user or order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const orderId = searchParams.get('order_id');
    const orderType = searchParams.get('order_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    if (!userId && !orderId) {
      return NextResponse.json(
        { error: 'Either user_id or order_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('marketplace_reviews')
      .select(`
        id,
        order_type,
        order_id,
        author_id,
        subject_user_id,
        rating,
        comment,
        response,
        created_at,
        author:users_profile!marketplace_reviews_author_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        subject_user:users_profile!marketplace_reviews_subject_user_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter by user or order
    if (userId) {
      query = query.eq('subject_user_id', userId);
    } else if (orderId && orderType) {
      query = query.eq('order_id', orderId).eq('order_type', orderType);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('marketplace_reviews')
      .select('*', { count: 'exact', head: true });

    if (userId) {
      countQuery = countQuery.eq('subject_user_id', userId);
    } else if (orderId && orderType) {
      countQuery = countQuery.eq('order_id', orderId).eq('order_type', orderType);
    }

    const { count } = await countQuery;

    // Calculate average rating if filtering by user
    let averageRating = null;
    if (userId) {
      const { data: ratingData, error: ratingError } = await supabase
        .from('marketplace_reviews')
        .select('rating')
        .eq('subject_user_id', userId);

      if (!ratingError && ratingData && ratingData.length > 0) {
        const totalRating = ratingData.reduce((sum, review) => sum + review.rating, 0);
        averageRating = Math.round((totalRating / ratingData.length) * 10) / 10;
      }
    }

    return NextResponse.json({
      reviews,
      averageRating,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      order_type, // 'rent' or 'sale'
      order_id,
      subject_user_id,
      rating,
      comment
    } = body;

    // Validate required fields
    if (!order_type || !order_id || !subject_user_id || !rating) {
      return NextResponse.json(
        { error: 'Order type, order ID, subject user ID, and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user is trying to review themselves
    if (subject_user_id === userProfile.id) {
      return NextResponse.json(
        { error: 'You cannot review yourself' },
        { status: 400 }
      );
    }

    // Validate order exists and user was involved
    let orderQuery;
    if (order_type === 'rent') {
      orderQuery = supabaseAdmin
        .from('rental_orders')
        .select('id, owner_id, renter_id, status')
        .eq('id', order_id);
    } else if (order_type === 'sale') {
      orderQuery = supabaseAdmin
        .from('sale_orders')
        .select('id, owner_id, buyer_id, status')
        .eq('id', order_id);
    } else {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user was involved in the order
    let userWasInvolved = false;
    if (order_type === 'rent') {
      userWasInvolved = order.owner_id === userProfile.id || (order as any).renter_id === userProfile.id;
    } else if (order_type === 'sale') {
      userWasInvolved = order.owner_id === userProfile.id || (order as any).buyer_id === userProfile.id;
    }

    if (!userWasInvolved) {
      return NextResponse.json(
        { error: 'You can only review orders you were involved in' },
        { status: 403 }
      );
    }

    // Check if order is completed
    if (order.status !== 'completed' && order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'You can only review completed orders' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this order
    const { data: existingReview, error: reviewError } = await supabaseAdmin
      .from('marketplace_reviews')
      .select('id')
      .eq('order_type', order_type)
      .eq('order_id', order_id)
      .eq('author_id', userProfile.id)
      .single();

    if (reviewError && reviewError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing review:', reviewError);
      return NextResponse.json(
        { error: 'Failed to check existing review' },
        { status: 500 }
      );
    }

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this order' },
        { status: 400 }
      );
    }

    // Validate subject user was involved in the order
    let subjectWasInvolved = false;
    if (order_type === 'rent') {
      subjectWasInvolved = order.owner_id === subject_user_id || (order as any).renter_id === subject_user_id;
    } else if (order_type === 'sale') {
      subjectWasInvolved = order.owner_id === subject_user_id || (order as any).buyer_id === subject_user_id;
    }

    if (!subjectWasInvolved) {
      return NextResponse.json(
        { error: 'Subject user was not involved in this order' },
        { status: 400 }
      );
    }

    // Create review
    const { data: review, error: insertError } = await supabaseAdmin
      .from('marketplace_reviews')
      .insert({
        order_type,
        order_id,
        author_id: userProfile.id,
        subject_user_id,
        rating,
        comment
      })
      .select(`
        id,
        order_type,
        order_id,
        author_id,
        subject_user_id,
        rating,
        comment,
        response,
        created_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating review:', insertError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review,
      message: 'Review created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create review API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
