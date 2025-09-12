import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for block user request
const BlockUserSchema = z.object({
  blockedUserId: z.string().uuid('Invalid user ID'),
  reason: z.enum(['harassment', 'spam', 'inappropriate', 'scam', 'other']),
  details: z.string().max(500, 'Details cannot exceed 500 characters').optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = BlockUserSchema.parse(body);

    // Create block directly
    const { data: block, error: blockError } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: profile.id,
        blocked_id: validatedData.blockedUserId,
        reason: validatedData.reason,
        details: validatedData.details,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (blockError) {
      console.error('Failed to create user block:', blockError);
      return NextResponse.json(
        { error: 'Failed to block user' },
        { status: 500 }
      );
    }

    const result = { blockId: block.id };

    return NextResponse.json({
      success: true,
      data: {
        blockId: result.blockId,
        createdAt: new Date().toISOString(),
        canCommunicate: false
      }
    });

  } catch (error: any) {
    console.error('Block user error:', error);
    
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
    if (error.message.includes('block yourself') ||
        error.message.includes('already blocked') ||
        error.message.includes('limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}