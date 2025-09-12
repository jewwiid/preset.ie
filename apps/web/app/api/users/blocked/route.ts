import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseUserBlockRepository } from '@preset/adapters/repositories/supabase-user-block-repository';
import { SupabaseProfileRepository } from '@preset/adapters/identity/SupabaseProfileRepository';
import { GetBlockedUsersUseCase } from '@preset/application/collaboration/use-cases/GetBlockedUsers';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for query parameters
const GetBlockedUsersSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['created_at', 'updated_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
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
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    };
    
    const validatedQuery = GetBlockedUsersSchema.parse(queryParams);

    // Initialize repositories and dependencies
    const userBlockRepo = new SupabaseUserBlockRepository(supabase);
    const profileRepo = new SupabaseProfileRepository(supabase);

    // Initialize use case
    const getBlockedUsersUseCase = new GetBlockedUsersUseCase(
      userBlockRepo,
      profileRepo
    );

    // Execute use case
    const result = await getBlockedUsersUseCase.execute({
      requestingUserId: profile.id,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder
    });

    return NextResponse.json({
      success: true,
      data: {
        blockedUsers: result.blockedUsers,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pagination: {
          limit: validatedQuery.limit || 20,
          offset: validatedQuery.offset || 0,
          totalCount: result.totalCount
        }
      }
    });

  } catch (error: any) {
    console.error('Get blocked users error:', error);
    
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
      { error: 'Failed to get blocked users' },
      { status: 500 }
    );
  }
}