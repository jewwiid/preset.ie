import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseUserBlockRepository } from '@preset/adapters/repositories/supabase-user-block-repository';
import { UnblockUserUseCase } from '@preset/application/collaboration/use-cases/UnblockUser';
import { InMemoryEventBus } from '@preset/adapters/events/InMemoryEventBus';
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UnblockUserSchema.parse(body);

    // Initialize repositories and dependencies
    const userBlockRepo = new SupabaseUserBlockRepository(supabase);
    const eventBus = new InMemoryEventBus();

    // Initialize use case
    const unblockUserUseCase = new UnblockUserUseCase(
      userBlockRepo,
      eventBus
    );

    // Execute use case
    const result = await unblockUserUseCase.execute({
      blockerUserId: profile.id,
      blockedUserId: validatedData.blockedUserId,
      reason: validatedData.reason
    });

    return NextResponse.json({
      success: true,
      data: {
        success: result.success,
        canCommunicate: result.canCommunicate,
        removedBlockId: result.removedBlockId
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