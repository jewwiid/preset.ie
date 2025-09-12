import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for conversation ID
const ConversationParamsSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID')
});

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

/**
 * PATCH endpoint to mark all messages in a conversation as read
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Validate conversation ID
    const resolvedParams = await context.params;
    const validatedParams = ConversationParamsSchema.parse(resolvedParams);

    // Check if user is a participant in this conversation using admin client
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(*)
      `)
      .eq('id', validatedParams.conversationId)
      .eq('participants.user_id', user.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = conversation.participants?.some((p: any) => p.user_id === user.id);
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not authorized to mark messages in this conversation as read' },
        { status: 403 }
      );
    }

    // Mark all messages as read for this user using admin client
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', validatedParams.conversationId)
      .eq('to_user_id', user.id)
      .is('read_at', null);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All messages marked as read',
      conversationId: validatedParams.conversationId,
      markedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Mark messages as read error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid conversation ID', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}