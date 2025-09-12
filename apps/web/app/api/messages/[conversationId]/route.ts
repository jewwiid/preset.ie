import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create anon client for user authentication
    const supabaseAnon = createSupabaseClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate conversation ID
    const resolvedParams = await context.params;
    const validatedParams = ConversationParamsSchema.parse(resolvedParams);

    // Get conversation directly using admin client
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        messages:messages(*),
        gig:gigs(*),
        participants:conversation_participants(*)
      `)
      .eq('id', validatedParams.conversationId)
      .eq('participants.user_id', user.id)
      .single();

    if (error || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

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
    
    // Create anon client for user authentication
    const supabaseAnon = createSupabaseClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate conversation ID
    const resolvedParams = await context.params;
    const validatedParams = ConversationParamsSchema.parse(resolvedParams);
    
    const body = await request.json();
    const { action } = body; // 'archive', 'block', 'unblock'

    if (!['archive', 'block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: archive, block, unblock' },
        { status: 400 }
      );
    }

    // Check if user is a participant using admin client
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