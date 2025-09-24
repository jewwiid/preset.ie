import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Create Supabase client with the user's access token for auth
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users_profile')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userProfile) {
    console.error('Error fetching user profile:', profileError);
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  const { id: showcaseId } = await params;
  
  // For POST requests, parse the action from the body
  // For DELETE requests, we know it's an unlike action
  let action = 'unlike'; // Default for DELETE
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      action = body.action || 'like';
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  }

  // Check if user can like this showcase
  const { data: showcase, error: showcaseError } = await supabase
    .from('showcases')
    .select('id, visibility, creator_user_id, talent_user_id')
    .eq('id', showcaseId)
    .single();

  if (showcaseError || !showcase) {
    console.error('Error fetching showcase:', showcaseError);
    return NextResponse.json({ error: 'Showcase not found' }, { status: 404 });
  }

  // Check if user can like this showcase
  const canLike = showcase.visibility === 'PUBLIC' || 
                  showcase.creator_user_id === userProfile.id || 
                  showcase.talent_user_id === userProfile.id;

  if (!canLike) {
    return NextResponse.json({ error: 'Cannot like this showcase' }, { status: 403 });
  }

  if (action === 'like') {
    const { error } = await supabase
      .from('showcase_likes')
      .insert({ showcase_id: showcaseId, user_id: user.id }); // Use auth user ID

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error liking showcase:', error);
      return NextResponse.json({ error: 'Failed to like showcase' }, { status: 500 });
    }
  } else if (action === 'unlike') {
    const { error } = await supabase
      .from('showcase_likes')
      .delete()
      .eq('showcase_id', showcaseId)
      .eq('user_id', user.id); // Use auth user ID

    if (error) {
      console.error('Error unliking showcase:', error);
      return NextResponse.json({ error: 'Failed to unlike showcase' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Recalculate likes count
  const { count, error: countError } = await supabase
    .from('showcase_likes')
    .select('*', { count: 'exact' })
    .eq('showcase_id', showcaseId);

  if (countError) {
    console.error('Error counting likes:', countError);
    return NextResponse.json({ error: 'Failed to get likes count' }, { status: 500 });
  }

  // Update the likes_count in the showcases table using service key to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { error: updateError } = await supabaseAdmin
    .from('showcases')
    .update({ 
      likes_count: count,
      updated_at: new Date().toISOString()
    })
    .eq('id', showcaseId);

  if (updateError) {
    console.error('Error updating likes count:', updateError);
    // Don't fail the request, just log the error
  }

  return NextResponse.json({ 
    likes_count: count, 
    is_liked_by_user: action === 'like' 
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Create Supabase client with the user's access token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users_profile')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userProfile) {
    console.error('Error fetching user profile:', profileError);
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  const { id: showcaseId } = await params;

  // Check if user can unlike this showcase (same logic as liking)
  const { data: showcase, error: showcaseError } = await supabase
    .from('showcases')
    .select('id, visibility, creator_user_id, talent_user_id')
    .eq('id', showcaseId)
    .single();

  if (showcaseError || !showcase) {
    console.error('Error fetching showcase:', showcaseError);
    return NextResponse.json({ error: 'Showcase not found' }, { status: 404 });
  }

  // Check if user can interact with this showcase
  const canInteract = showcase.visibility === 'PUBLIC' || 
                      showcase.creator_user_id === userProfile.id || 
                      showcase.talent_user_id === userProfile.id;

  if (!canInteract) {
    return NextResponse.json({ error: 'Cannot interact with this showcase' }, { status: 403 });
  }

  // Unlike the showcase
  const { error } = await supabase
    .from('showcase_likes')
    .delete()
    .eq('showcase_id', showcaseId)
    .eq('user_id', user.id); // Use auth user ID

  if (error) {
    console.error('Error unliking showcase:', error);
    return NextResponse.json({ error: 'Failed to unlike showcase' }, { status: 500 });
  }

  // Recalculate likes count
  const { count, error: countError } = await supabase
    .from('showcase_likes')
    .select('*', { count: 'exact' })
    .eq('showcase_id', showcaseId);

  if (countError) {
    console.error('Error counting likes:', countError);
    return NextResponse.json({ error: 'Failed to get likes count' }, { status: 500 });
  }

  // Update the likes_count in the showcases table using service key to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { error: updateError } = await supabaseAdmin
    .from('showcases')
    .update({ 
      likes_count: count,
      updated_at: new Date().toISOString()
    })
    .eq('id', showcaseId);

  if (updateError) {
    console.error('Error updating likes count:', updateError);
    // Don't fail the request, just log the error
  }

  return NextResponse.json({ 
    likes_count: count, 
    is_liked_by_user: false 
  });
}