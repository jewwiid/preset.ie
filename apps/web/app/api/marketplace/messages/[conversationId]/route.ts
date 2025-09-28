import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/messages/[conversationId] - Get messages for a specific marketplace conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Await params
    const { conversationId } = await params;
    
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

    // Get conversation details from the conversation ID (which is the listing_id for marketplace)
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('listings')
      .select(`
        id,
        title,
        category,
        mode,
        status,
        owner_id,
        users_profile!listings_owner_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages for this conversation (listing)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        from_user_id,
        to_user_id,
        body,
        created_at,
        read_at,
        context_type
      `)
      .eq('listing_id', conversationId)
      .eq('context_type', 'marketplace')
      .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Transform messages to match expected format
    const transformedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      conversationId: conversationId,
      fromUserId: msg.from_user_id,
      toUserId: msg.to_user_id,
      body: msg.body,
      sentAt: msg.created_at,
      read: !!msg.read_at,
      status: 'delivered' as const
    })) || [];

    // Mark messages as read
    if (messages && messages.length > 0) {
      await supabaseAdmin
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('listing_id', conversationId)
        .eq('to_user_id', userProfile.id)
        .is('read_at', null);
    }

    return NextResponse.json({
      id: conversationId,
      gigId: conversationId, // Use conversation ID as gigId for compatibility
      participants: [userProfile.id, conversation.owner_id],
      messages: transformedMessages,
      status: 'ACTIVE' as const,
      startedAt: transformedMessages[0]?.sentAt || new Date().toISOString(),
      lastMessageAt: transformedMessages[transformedMessages.length - 1]?.sentAt || new Date().toISOString(),
      context: {
        type: 'marketplace' as const,
        listing: conversation
      }
    });

  } catch (error: any) {
    console.error('Error fetching marketplace conversation details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/messages/[conversationId] - Delete a marketplace conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Await params
    const { conversationId } = await params;
    
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

    // Verify user has permission to delete messages for this conversation (listing)
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('owner_id')
      .eq('id', conversationId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is either the listing owner or a participant in the conversation
    const { data: participantCheck } = await supabaseAdmin
      .from('messages')
      .select('from_user_id, to_user_id')
      .eq('listing_id', conversationId)
      .eq('context_type', 'marketplace')
      .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
      .limit(1);

    if (!participantCheck || participantCheck.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized - You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Delete all messages for this conversation
    const { error: deleteError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('listing_id', conversationId)
      .eq('context_type', 'marketplace');

    if (deleteError) {
      console.error('Error deleting messages:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting marketplace conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}