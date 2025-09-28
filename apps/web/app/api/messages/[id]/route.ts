import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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

    // Get user profile ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Validate conversation ID
    const resolvedParams = await context.params;
    const validatedParams = ConversationParamsSchema.parse(resolvedParams);

    // Get messages for this conversation (using gig_id as conversation_id)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        gig:gigs(*)
      `)
      .eq('gig_id', validatedParams.id)
      .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch conversation messages' },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get gig information
    const gig = messages[0]?.gig;
    if (!gig) {
      return NextResponse.json(
        { error: 'Gig not found' },
        { status: 404 }
      );
    }

    // Get unique user IDs from messages
    const userIds = [...new Set([
      ...messages.map(m => m.from_user_id),
      ...messages.map(m => m.to_user_id)
    ])];

    // Fetch user profiles
    const { data: userProfiles, error: profilesError } = await supabaseAdmin
      .from('users_profile')
      .select('id, display_name, handle, avatar_url, verified_id')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }

    // Create user profile lookup
    const userProfileMap = new Map(userProfiles?.map(profile => [profile.id, profile]) || []);

    // Get other participant
    const otherUserId = messages.find(m => m.from_user_id !== userProfile.id)?.from_user_id || 
                       messages.find(m => m.to_user_id !== userProfile.id)?.to_user_id;

    // Transform to expected format
    const conversationData = {
      id: validatedParams.id,
      gigId: validatedParams.id,
      participants: [userProfile.id, otherUserId].filter(Boolean),
      messages: messages.map(msg => ({
        id: msg.id,
        fromUserId: msg.from_user_id,
        toUserId: msg.to_user_id,
        body: msg.body,
        attachments: msg.attachments || [],
        sentAt: msg.created_at,
        readAt: msg.read_at,
        editedAt: msg.updated_at,
        deletedAt: null,
        fromUser: userProfileMap.get(msg.from_user_id),
        toUser: userProfileMap.get(msg.to_user_id)
      })),
      status: 'ACTIVE' as const,
      startedAt: messages[0]?.created_at,
      lastMessageAt: messages[messages.length - 1]?.created_at
    };

    return NextResponse.json({
      success: true,
      data: conversationData
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

    // Get user profile ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
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

    // Check if user is a participant by checking if they have messages in this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('gig_id', validatedParams.id)
      .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
      .limit(1);

    if (messagesError || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
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

/**
 * DELETE endpoint to delete a conversation and all its messages
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Get user profile ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Validate conversation ID
    const resolvedParams = await context.params;
    const validatedParams = ConversationParamsSchema.parse(resolvedParams);

    // Check if user is a participant by checking if they have messages in this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('gig_id', validatedParams.id)
      .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
      .limit(1);

    if (messagesError || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Delete all messages for this conversation
    const { error: deleteError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('gig_id', validatedParams.id);

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
    console.error('Delete conversation error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid conversation ID', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
