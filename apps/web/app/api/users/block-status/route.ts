import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for query parameters
const CheckBlockStatusSchema = z.object({
  otherUserId: z.string().uuid('Invalid user ID')
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

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      otherUserId: searchParams.get('otherUserId')
    };
    
    const validatedQuery = CheckBlockStatusSchema.parse(queryParams);

    // Check block status directly
    const { data: block, error } = await supabase
      .from('user_blocks')
      .select('*')
      .or(`blocker_id.eq.${profile.id},blocker_id.eq.${validatedQuery.otherUserId}`)
      .or(`blocked_id.eq.${profile.id},blocked_id.eq.${validatedQuery.otherUserId}`)
      .single();

    const result = {
      isBlocked: !!block,
      blockDirection: block ? (block.blocker_id === profile.id ? 'blocking' : 'blocked') : null
    };

    return NextResponse.json({
      success: true,
      data: {
        youBlockedThem: result.blockDirection === 'blocking',
        theyBlockedYou: result.blockDirection === 'blocked',
        mutualBlock: false, // Simplified for now
        canCommunicate: !result.isBlocked
      }
    });

  } catch (error: any) {
    console.error('Check block status error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: error.issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to check block status' },
      { status: 500 }
    );
  }
}