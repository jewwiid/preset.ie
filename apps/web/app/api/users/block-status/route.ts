import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseUserBlockRepository } from '@preset/adapters/repositories/supabase-user-block-repository';
import { CheckUserBlockedUseCase } from '@preset/application/collaboration/use-cases/CheckUserBlocked';
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

    // Initialize repositories and dependencies
    const userBlockRepo = new SupabaseUserBlockRepository(supabase);

    // Initialize use case
    const checkUserBlockedUseCase = new CheckUserBlockedUseCase(userBlockRepo);

    // Execute use case
    const result = await checkUserBlockedUseCase.execute({
      userId1: profile.id,
      userId2: validatedQuery.otherUserId
    });

    return NextResponse.json({
      success: true,
      data: {
        youBlockedThem: result.user2BlockedByUser1,
        theyBlockedYou: result.user1BlockedByUser2,
        mutualBlock: result.mutualBlock,
        canCommunicate: result.canCommunicate
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