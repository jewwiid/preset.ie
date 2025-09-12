import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for send message request
const SendMessageSchema = z.object({
  gigId: z.string().uuid('Invalid gig ID'),
  toUserId: z.string().uuid('Invalid recipient user ID'),
  body: z.string().min(1, 'Message body cannot be empty').max(2000, 'Message too long'),
  attachments: z.array(z.object({
    url: z.string().url('Invalid attachment URL'),
    name: z.string().min(1, 'Attachment name required'),
    size: z.number().min(0, 'Invalid file size'),
    type: z.string().min(1, 'Attachment type required')
  })).optional()
});

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = SendMessageSchema.parse(body);

    // Create message directly using admin client
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        gig_id: validatedData.gigId,
        from_user_id: user.id,
        to_user_id: validatedData.toUserId,
        body: validatedData.body,
        attachments: validatedData.attachments || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error('Failed to create message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    const result = { messageId: message.id };

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Send message error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    // Handle domain-specific errors
    if (error.message.includes('not found') || 
        error.message.includes('not applied') ||
        error.message.includes('declined')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    if (error.message.includes('must apply')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}