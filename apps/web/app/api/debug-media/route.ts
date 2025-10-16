import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG MEDIA API CALLED');

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

    console.log(`✅ Auth user: ${user.id} (${user.email})`);

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Direct query to playground_gallery
    console.log(`🔍 Querying playground_gallery for user_id: ${user.id}`);
    const { data: directGallery, error: directError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .eq('user_id', user.id);

    if (directError) {
      console.error('❌ Direct query error:', directError);
      return NextResponse.json({ error: directError.message }, { status: 500 });
    }

    console.log(`✅ Direct query found ${directGallery?.length || 0} items`);

    // Step 2: Check if there are any items at all
    const { data: allGallery, error: allError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id, user_id, title')
      .limit(10);

    console.log(`✅ Total items in playground_gallery: ${allGallery?.length || 0}`);

    // Step 3: Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id, user_id, display_name')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log(`✅ User profile: ${userProfile.display_name} (${userProfile.id})`);
    }

    return NextResponse.json({
      success: true,
      authUser: {
        id: user.id,
        email: user.email
      },
      userProfile: userProfile || null,
      directGalleryCount: directGallery?.length || 0,
      directGalleryItems: directGallery?.map(item => ({
        id: item.id,
        title: item.title?.substring(0, 50) + '...',
        user_id: item.user_id,
        created_at: item.created_at
      })) || [],
      totalGalleryCount: allGallery?.length || 0,
      allGalleryItems: allGallery?.map(item => ({
        id: item.id,
        title: item.title?.substring(0, 50) + '...',
        user_id: item.user_id,
        matchesAuthUser: item.user_id === user.id
      })) || []
    });

  } catch (error: any) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}