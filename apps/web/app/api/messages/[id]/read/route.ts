import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for conversation ID
const ConversationParamsSchema = z.object({
  id: z.string().uuid('Invalid conversation ID')
});

interface RouteContext {
  params: Promise<{
    id: string;
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

    // Check if user is a participant by checking if they have messages in this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('gig_id', validatedParams.id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .limit(1);

    if (messagesError || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Mark all messages as read for this user using admin client
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('gig_id', validatedParams.id)
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
      conversationId: validatedParams.id,
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
