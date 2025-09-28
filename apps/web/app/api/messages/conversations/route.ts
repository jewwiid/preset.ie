import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for query parameters
const GetConversationsQuerySchema = z.object({
  gigId: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'BLOCKED']).optional(),
  hasUnread: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).default(20),
  offset: z.string().transform(val => parseInt(val, 10)).default(0)
});

export async function GET(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create anon client for user authentication
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      console.log('❌ Token validation error:', authError?.message || 'No user found');
      // For now, return empty conversations instead of error
      return NextResponse.json({
        conversations: [],
        total: 0,
        totalUnread: 0
      });
    }

    // Get user profile ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.log('❌ User profile not found');
      return NextResponse.json({
        conversations: [],
        total: 0,
        totalUnread: 0
      });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = GetConversationsQuerySchema.parse(queryObject);

    // Get conversations by querying messages directly with user profile data
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        gig_id,
        from_user_id,
        to_user_id,
        body,
        created_at,
        read_at,
        from_user:users_profile!messages_from_user_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        to_user:users_profile!messages_to_user_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
      .not('gig_id', 'is', null) // Only include gig conversations, not marketplace conversations
      .order('created_at', { ascending: false })
      .limit(validatedQuery.limit * 10); // Get more messages to group by conversation

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Group messages by gig_id to create conversations
    const conversationMap = new Map();
    
    messages?.forEach((message: any) => {
      const gigId = message.gig_id;
      if (!conversationMap.has(gigId)) {
        conversationMap.set(gigId, {
          gig_id: gigId,
          gig: null, // We'll fetch gig data separately if needed
          messages: [],
          unread_count: 0,
          last_message_at: message.created_at,
          last_message_id: message.id,
          last_message_content: message.body,
          other_user_id: message.from_user_id === userProfile.id ? message.to_user_id : message.from_user_id
        });
      }
      
      const conv = conversationMap.get(gigId);
      conv.messages.push(message);
      
      // Count unread messages (messages sent to user that haven't been read)
      if (message.to_user_id === userProfile.id && !message.read_at) {
        conv.unread_count++;
      }
      
            // Update last message if this is more recent
            if (new Date(message.created_at) > new Date(conv.last_message_at)) {
              conv.last_message_at = message.created_at;
              conv.last_message_id = message.id;
              conv.last_message_content = message.body;
              conv.other_user_id = message.from_user_id === userProfile.id ? message.to_user_id : message.from_user_id;
              // Store user profile data
              conv.other_user_profile = message.from_user_id === userProfile.id ? message.to_user : message.from_user;
            }
    });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      .slice(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit);

    // Transform the function result to match the expected API structure
    const transformedConversations = conversations?.map((conv: any) => ({
      id: conv.gig_id, // Use gig_id as conversation ID
      gigId: conv.gig_id,
      participants: [userProfile.id, conv.other_user_id],
      lastMessage: {
        id: conv.last_message_id,
        body: conv.last_message_content,
        fromUserId: conv.last_message_content ? userProfile.id : conv.other_user_id, // Simplified
        sentAt: conv.last_message_at,
        read: conv.unread_count === 0
      },
      unreadCount: conv.unread_count || 0,
      status: 'ACTIVE' as const,
      startedAt: conv.last_message_at, // Use last message time as started time
      lastMessageAt: conv.last_message_at,
      context: { type: 'gig' as const },
      otherUser: conv.other_user_profile ? {
        id: conv.other_user_profile.id,
        display_name: conv.other_user_profile.display_name,
        handle: conv.other_user_profile.handle,
        avatar_url: conv.other_user_profile.avatar_url,
        verified_id: conv.other_user_profile.verified_id
      } : {
        id: conv.other_user_id,
        display_name: `User ${conv.other_user_id?.slice(-4)}`,
        handle: `user_${conv.other_user_id?.slice(-4)}`,
        avatar_url: null,
        verified_id: false
      }
    })) || [];

    // Calculate total unread count
    const totalUnread = transformedConversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);

    const result = {
      conversations: transformedConversations,
      total: transformedConversations.length,
      totalUnread: totalUnread
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Get conversations error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to create a new conversation or send first message
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create anon client for user authentication
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      console.log('❌ Token validation error:', authError?.message || 'No user found');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { gigId, toUserId, message } = body;

    if (!gigId || !toUserId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: gigId, toUserId, message' },
        { status: 400 }
      );
    }

    // TODO: Initialize and use SendMessageUseCase here
    // This will be implemented when we create the send message endpoint
    
    return NextResponse.json(
      { error: 'Not implemented yet - use /api/messages/send' },
      { status: 501 }
    );

  } catch (error: any) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}