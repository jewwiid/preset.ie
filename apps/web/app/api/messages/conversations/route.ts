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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = GetConversationsQuerySchema.parse(queryObject);

    // Get conversations by querying messages directly
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        gig_id,
        from_user_id,
        to_user_id,
        body,
        created_at,
        read_at,
        gig:gigs(*)
      `)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
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
          gig: message.gig,
          messages: [],
          unread_count: 0,
          last_message_at: message.created_at,
          last_message_id: message.id,
          last_message_content: message.body,
          other_user_id: message.from_user_id === user.id ? message.to_user_id : message.from_user_id
        });
      }
      
      const conv = conversationMap.get(gigId);
      conv.messages.push(message);
      
      // Count unread messages (messages sent to user that haven't been read)
      if (message.to_user_id === user.id && !message.read_at) {
        conv.unread_count++;
      }
      
      // Update last message if this is more recent
      if (new Date(message.created_at) > new Date(conv.last_message_at)) {
        conv.last_message_at = message.created_at;
        conv.last_message_id = message.id;
        conv.last_message_content = message.body;
        conv.other_user_id = message.from_user_id === user.id ? message.to_user_id : message.from_user_id;
      }
    });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      .slice(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit);

    // Transform the function result to match the expected API structure
    const transformedConversations = conversations?.map((conv: any) => ({
      id: conv.gig_id, // Use gig_id as conversation ID
      gigId: conv.gig_id,
      participants: [user.id, conv.other_user_id],
      lastMessage: {
        id: conv.last_message_id,
        body: conv.last_message_content,
        fromUserId: conv.last_message_content ? user.id : conv.other_user_id, // Simplified
        sentAt: conv.last_message_at,
        read: conv.unread_count === 0
      },
      unreadCount: conv.unread_count || 0,
      status: 'ACTIVE' as const,
      startedAt: conv.last_message_at, // Use last message time as started time
      lastMessageAt: conv.last_message_at
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