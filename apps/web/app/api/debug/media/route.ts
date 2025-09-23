import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get all media records
    const { data: allMedia, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .limit(10);

    // Get user's media specifically
    const { data: userMedia, error: userMediaError } = await supabase
      .from('media')
      .select('*')
      .eq('owner_user_id', userProfile?.id || 'not-found')
      .limit(10);

    return NextResponse.json({
      authUser: {
        id: user.id,
        email: user.email
      },
      userProfile: userProfile || null,
      profileError: profileError?.message || null,
      allMedia: allMedia || [],
      mediaError: mediaError?.message || null,
      userMedia: userMedia || [],
      userMediaError: userMediaError?.message || null,
      debug: {
        totalMediaRecords: allMedia?.length || 0,
        userMediaRecords: userMedia?.length || 0,
        profileExists: !!userProfile,
        profileId: userProfile?.id || 'not-found'
      }
    });

  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
