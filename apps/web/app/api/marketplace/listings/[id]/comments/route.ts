import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/listings/[id]/comments - Get comments for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get comments with user profiles
    const { data: comments, error } = await supabaseAdmin
      .from('listing_comments')
      .select(`
        id,
        listing_id,
        user_id,
        parent_comment_id,
        body,
        created_at,
        updated_at,
        is_deleted,
        user:users_profile!listing_comments_user_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .eq('listing_id', listingId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching listing comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Organize comments into threads (parent comments and their replies)
    const parentComments = comments?.filter(comment => !comment.parent_comment_id) || [];
    const replies = comments?.filter(comment => comment.parent_comment_id) || [];

    // Group replies by parent comment
    const repliesByParent = replies.reduce((acc, reply) => {
      if (!acc[reply.parent_comment_id!]) {
        acc[reply.parent_comment_id!] = [];
      }
      acc[reply.parent_comment_id!].push(reply);
      return acc;
    }, {} as Record<string, any[]>);

    // Add replies to parent comments
    const commentsWithReplies = parentComments.map(comment => ({
      ...comment,
      replies: repliesByParent[comment.id] || []
    }));

    return NextResponse.json({
      success: true,
      data: {
        comments: commentsWithReplies,
        total: comments?.length || 0
      }
    });

  } catch (error) {
    console.error('Get listing comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/listings/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
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
    const { comment_body, parent_comment_id } = body;

    if (!comment_body || comment_body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      );
    }

    if (comment_body.length > 2000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Check if listing exists
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, owner_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Prevent users from commenting on their own listings
    if (userProfile.id === listing.owner_id) {
      return NextResponse.json(
        { error: 'You cannot comment on your own listing' },
        { status: 400 }
      );
    }

    // If replying to a comment, verify parent comment exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('listing_comments')
        .select('id, listing_id')
        .eq('id', parent_comment_id)
        .eq('listing_id', listingId)
        .eq('is_deleted', false)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // Create comment
    const { data: comment, error: insertError } = await supabaseAdmin
      .from('listing_comments')
      .insert({
        listing_id: listingId,
        user_id: userProfile.id,
        parent_comment_id: parent_comment_id || null,
        body: comment_body.trim()
      })
      .select(`
        id,
        listing_id,
        user_id,
        parent_comment_id,
        body,
        created_at,
        user:users_profile!listing_comments_user_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comment
    }, { status: 201 });

  } catch (error) {
    console.error('Create listing comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
