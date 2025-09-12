import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for unblock user request
const UnblockUserSchema = z.object({
  blockedUserId: z.string().uuid('Invalid user ID'),
  reason: z.string().max(200, 'Reason cannot exceed 200 characters').optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
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
    const validatedData = UnblockUserSchema.parse(body);

    // Remove block directly
    const { error: deleteError } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', profile.id)
      .eq('blocked_id', validatedData.blockedUserId);

    if (deleteError) {
      console.error('Failed to unblock user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unblock user' },
        { status: 500 }
      );
    }

    const result = { success: true };

    return NextResponse.json({
      success: true,
      data: {
        success: result.success,
        canCommunicate: true,
        removedBlockId: validatedData.blockedUserId
      }
    });

  } catch (error: any) {
    console.error('Unblock user error:', error);
    
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
    if (error.message.includes('unblock yourself') ||
        error.message.includes('only the user who created')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}