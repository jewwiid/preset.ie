import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseConversationRepository } from '@preset/adapters/repositories/supabase-conversation-repository';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for conversation ID
const ConversationParamsSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID')
});

interface RouteContext {
  params: {
    conversationId: string;
  };
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate conversation ID
    const validatedParams = ConversationParamsSchema.parse(context.params);

    // Initialize repository
    const conversationRepo = new SupabaseConversationRepository(supabase);
    
    // Check if user is a participant in this conversation
    const conversation = await conversationRepo.findById(validatedParams.conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (!conversation.hasParticipant(user.id)) {
      return NextResponse.json(
        { error: 'You are not authorized to mark messages in this conversation as read' },
        { status: 403 }
      );
    }

    // Mark all messages as read for this user
    await conversationRepo.markAllAsRead(validatedParams.conversationId, user.id);

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