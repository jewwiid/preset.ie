import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseUserBlockRepository } from '@preset/adapters/repositories/supabase-user-block-repository';
import { SupabaseProfileRepository } from '@preset/adapters/identity/SupabaseProfileRepository';
import { BlockUserUseCase } from '@preset/application/collaboration/use-cases/BlockUser';
import { InMemoryEventBus } from '@preset/adapters/events/InMemoryEventBus';
import { IdGenerator } from '@preset/domain/shared/IdGenerator';
import { BlockReason } from '@preset/domain/collaboration/value-objects/BlockReason';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for block user request
const BlockUserSchema = z.object({
  blockedUserId: z.string().uuid('Invalid user ID'),
  reason: z.nativeEnum(BlockReason, { 
    errorMap: () => ({ message: 'Invalid block reason' })
  }),
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
    const validatedData = BlockUserSchema.parse(body);

    // Initialize repositories and dependencies
    const userBlockRepo = new SupabaseUserBlockRepository(supabase);
    const profileRepo = new SupabaseProfileRepository(supabase);
    const eventBus = new InMemoryEventBus();
    const idGenerator = new IdGenerator();

    // Initialize use case
    const blockUserUseCase = new BlockUserUseCase(
      userBlockRepo,
      profileRepo,
      eventBus,
      idGenerator
    );

    // Execute use case
    const result = await blockUserUseCase.execute({
      blockerUserId: profile.id,
      blockedUserId: validatedData.blockedUserId,
      reason: validatedData.reason,
      details: validatedData.details
    });

    return NextResponse.json({
      success: true,
      data: {
        blockId: result.blockId,
        createdAt: result.createdAt.toISOString(),
        canCommunicate: result.canCommunicate
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