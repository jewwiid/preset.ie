import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/requests/[id]/conversation/messages - Get messages for conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
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

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from('request_conversations')
      .select('id')
      .eq('request_id', requestId)
      .or(`requester_id.eq.${user.id},responder_id.eq.${user.id}`)
      .single();

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied' 
      }, { status: 404 });
    }

    // Get messages (using notifications table for now)
    const { data: messages, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        message,
        action_data,
        sender_id,
        created_at,
        sender:users_profile!notifications_sender_id_fkey(
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('related_request_id', requestId)
      .eq('type', 'request_message_received')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch messages' 
      }, { status: 500 });
    }

    // Transform messages to include message content
    const transformedMessages = messages?.map(msg => ({
      id: msg.id,
      content: msg.action_data?.message_preview || msg.message,
      sender_id: msg.sender_id,
      sender: msg.sender,
      created_at: msg.created_at,
      type: msg.action_data?.message_type || 'text'
    })) || [];

    return NextResponse.json({ 
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        total: transformedMessages.length,
        has_more: transformedMessages.length === limit
      }
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/marketplace/requests/[id]/conversation/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const body = await request.json();
    const { message, message_type = 'text' } = body;
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message content is required' 
      }, { status: 400 });
    }
    
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

    // Get conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('request_conversations')
      .select(`
        id,
        requester_id,
        responder_id,
        request:equipment_requests(
          id,
          title
        )
      `)
      .eq('request_id', requestId)
      .or(`requester_id.eq.${user.id},responder_id.eq.${user.id}`)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied' 
      }, { status: 404 });
    }

    // Create message using the database function
    const { data: notificationId, error } = await supabase
      .rpc('create_request_conversation_message', {
        p_conversation_id: conversation.id,
        p_sender_id: user.id,
        p_message: message,
        p_message_type: message_type
      });

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ 
        error: 'Failed to send message' 
      }, { status: 500 });
    }

    // Get the created message
    const { data: newMessage, error: messageError } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        message,
        action_data,
        sender_id,
        created_at,
        sender:users_profile!notifications_sender_id_fkey(
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('id', notificationId)
      .single();

    if (messageError) {
      console.error('Error fetching new message:', messageError);
      return NextResponse.json({ 
        error: 'Message sent but failed to retrieve' 
      }, { status: 500 });
    }

    const transformedMessage = {
      id: newMessage.id,
      content: newMessage.action_data?.message_preview || newMessage.message,
      sender_id: newMessage.sender_id,
      sender: newMessage.sender,
      created_at: newMessage.created_at,
      type: newMessage.action_data?.message_type || 'text'
    };

    return NextResponse.json({ 
      message: transformedMessage,
      message_id: notificationId
    }, { status: 201 });

  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
