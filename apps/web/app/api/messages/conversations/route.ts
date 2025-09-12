import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseConversationRepository } from '@preset/adapters/repositories/supabase-conversation-repository';
import { GetConversationsUseCase } from '@preset/application/collaboration/use-cases/GetConversations';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for query parameters
const GetConversationsQuerySchema = z.object({
  gigId: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'BLOCKED']).optional(),
  hasUnread: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).default('20'),
  offset: z.string().transform(val => parseInt(val, 10)).default('0')
});

export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = GetConversationsQuerySchema.parse(queryObject);

    // Initialize use case
    const conversationRepo = new SupabaseConversationRepository(supabase);
    const getConversationsUseCase = new GetConversationsUseCase(conversationRepo);

    // Execute use case
    const result = await getConversationsUseCase.execute({
      userId: user.id,
      ...validatedQuery
    });

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
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