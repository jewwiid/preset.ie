import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseConversationRepository } from '@preset/adapters/repositories/supabase-conversation-repository';
import { GetConversationUseCase } from '@preset/application/collaboration/use-cases/GetConversations';
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

export async function GET(request: NextRequest, context: RouteContext) {
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

    // Initialize use case
    const conversationRepo = new SupabaseConversationRepository(supabase);
    const getConversationUseCase = new GetConversationUseCase(conversationRepo);

    // Execute use case
    const conversation = await getConversationUseCase.execute({
      conversationId: validatedParams.conversationId,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: conversation
    });

  } catch (error: any) {
    console.error('Get conversation error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid conversation ID', details: error.issues },
        { status: 400 }
      );
    }
    
    // Handle domain-specific errors
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    if (error.message.includes('not a participant')) {
      return NextResponse.json(
        { error: 'You are not authorized to view this conversation' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint to update conversation status (e.g., archive, block)
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
    
    const body = await request.json();
    const { action } = body; // 'archive', 'block', 'unblock'

    if (!['archive', 'block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: archive, block, unblock' },
        { status: 400 }
      );
    }

    // Initialize repository
    const conversationRepo = new SupabaseConversationRepository(supabase);
    
    // Check if user is a participant
    const conversation = await conversationRepo.findById(validatedParams.conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (!conversation.hasParticipant(user.id)) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this conversation' },
        { status: 403 }
      );
    }

    // TODO: Implement conversation status updates in domain model
    // For now, return not implemented
    return NextResponse.json(
      { error: `Conversation ${action} not implemented yet` },
      { status: 501 }
    );

  } catch (error: any) {
    console.error('Update conversation error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid conversation ID', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}