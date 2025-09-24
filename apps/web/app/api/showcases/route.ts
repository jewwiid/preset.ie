import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: NextRequest) {
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
    
    // Create Supabase client for user authentication
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get showcase ID from request body
    const { showcaseId } = await request.json();
    
    if (!showcaseId) {
      return NextResponse.json(
        { error: 'Showcase ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, role_flags')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user owns this showcase
    const { data: showcase, error: showcaseError } = await supabase
      .from('showcases')
      .select('id, creator_user_id, talent_user_id')
      .eq('id', showcaseId)
      .single();

    if (showcaseError || !showcase) {
      console.error('Error fetching showcase:', showcaseError);
      return NextResponse.json({ error: 'Showcase not found' }, { status: 404 });
    }

    // Check if user is admin or owns the showcase
    const isAdmin = Array.isArray(userProfile.role_flags) && userProfile.role_flags.includes('ADMIN');
    const isOwner = showcase.creator_user_id === userProfile.id || 
                    showcase.talent_user_id === userProfile.id;
    const canDelete = isAdmin || isOwner;
    
    console.log('Delete permission check:', {
      userId: user.id,
      userProfileId: userProfile.id,
      showcaseCreatorId: showcase.creator_user_id,
      showcaseTalentId: showcase.talent_user_id,
      isAdmin,
      isOwner,
      canDelete
    });

    if (!canDelete) {
      return NextResponse.json({ error: 'You can only delete your own showcases' }, { status: 403 });
    }

    // Delete the showcase (cascade will handle related records)
    console.log('Attempting to delete showcase:', showcaseId);
    
    // Use service key to bypass RLS for the delete operation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: deleteError } = await supabaseAdmin
      .from('showcases')
      .delete()
      .eq('id', showcaseId);

    if (deleteError) {
      console.error('Error deleting showcase:', deleteError);
      return NextResponse.json({ error: 'Failed to delete showcase' }, { status: 500 });
    }

    console.log('Showcase deleted successfully:', showcaseId);

    return NextResponse.json({ 
      success: true, 
      message: 'Showcase deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error in DELETE showcase API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    
    // Create Supabase client for user authentication
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const userId = searchParams.get('userId');
  const filter = searchParams.get('filter') || 'trending';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = supabase
    .from('showcases')
    .select(`
      *,
      creator:users_profile!showcases_creator_user_id_fkey (
        id,
        display_name,
        handle,
        avatar_url,
        verified_id
      ),
      showcase_media (
        id,
        media_id,
        sort_order,
        media:media (
          id,
          url,
          type,
          thumbnail_url
        )
      ),
      showcase_likes(user_id)
    `)
    .eq('visibility', 'PUBLIC');

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  if (userId) {
    query = query.eq('creator_user_id', userId);
  }

  // Add pagination and ordering based on filter
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Apply different ordering based on filter
  switch (filter) {
    case 'trending':
      // Order by likes count and recency (we'll sort by likes_count in the response)
      query = query.range(from, to).order('created_at', { ascending: false });
      break;
    case 'featured':
      // Order by verification status and likes (we'll sort by creator verification in the response)
      query = query.range(from, to).order('created_at', { ascending: false });
      break;
    case 'latest':
      // Order by creation date (most recent first)
      query = query.range(from, to).order('created_at', { ascending: false });
      break;
    case 'community':
      // Order by engagement (likes + comments) - we'll sort by engagement in the response
      query = query.range(from, to).order('created_at', { ascending: false });
      break;
    default:
      query = query.range(from, to).order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching showcases:', error);
    return NextResponse.json({ error: 'Failed to fetch showcases' }, { status: 500 });
  }

  // Format the response
  const formattedShowcases = data.map(showcase => ({
    id: showcase.id,
    title: showcase.title,
    description: showcase.description,
    type: showcase.type,
    media: showcase.showcase_media
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((sm: any) => ({
        id: sm.media.id,
        url: sm.media.url,
        type: sm.media.type,
        thumbnail_url: sm.media.thumbnail_url
      })),
    tags: showcase.tags || [],
    likes_count: showcase.showcase_likes.length,
    is_liked_by_user: showcase.showcase_likes.some((like: any) => like.user_id === user.id),
    comments_count: 0, // TODO: Implement comments
    created_at: showcase.created_at,
    creator: showcase.creator,
    moodboard_summary: showcase.moodboard_summary,
    moodboard_palette: showcase.moodboard_palette
  }));

  // Apply sorting based on filter
  let sortedShowcases = formattedShowcases;
  
  switch (filter) {
    case 'trending':
      // Sort by likes count (descending), then by recency
      sortedShowcases = formattedShowcases.sort((a, b) => {
        if (b.likes_count !== a.likes_count) {
          return b.likes_count - a.likes_count;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      break;
    case 'featured':
      // Sort by verified creators first, then by likes
      sortedShowcases = formattedShowcases.sort((a, b) => {
        const aVerified = a.creator?.verified_id ? 1 : 0;
        const bVerified = b.creator?.verified_id ? 1 : 0;
        if (bVerified !== aVerified) {
          return bVerified - aVerified;
        }
        return b.likes_count - a.likes_count;
      });
      break;
    case 'latest':
      // Already sorted by created_at in the query
      break;
    case 'community':
      // Sort by engagement (likes + comments)
      sortedShowcases = formattedShowcases.sort((a, b) => {
        const aEngagement = a.likes_count + a.comments_count;
        const bEngagement = b.likes_count + b.comments_count;
        return bEngagement - aEngagement;
      });
      break;
  }

  return NextResponse.json({ showcases: sortedShowcases });
  
  } catch (error) {
    console.error('Error in showcases GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    
    // Create Supabase client for user authentication
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

  const {
    title,
    description,
    type,
    mediaIds,
    tags,
    moodboardId,
    mediaMetadata,
    visibility
  } = await request.json();

  // Check subscription tier and monthly limits
  const { data: profile, error: subscriptionProfileError } = await supabase
    .from('users_profile')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single();

  if (subscriptionProfileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const subscriptionTier = profile.subscription_tier || 'FREE'
  
  // Check monthly showcase limits based on subscription tier
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const { data: existingShowcases } = await supabase
    .from('showcases')
    .select('id')
    .eq('creator_user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  const currentMonthCount = existingShowcases?.length || 0
  
  // Apply subscription tier limits
  let maxShowcases = 0
  switch (subscriptionTier) {
    case 'FREE':
      maxShowcases = 3
      break
    case 'PLUS':
      maxShowcases = 10
      break
    case 'PRO':
      maxShowcases = -1 // unlimited
      break
    default:
      maxShowcases = 0
  }

  if (maxShowcases !== -1 && currentMonthCount >= maxShowcases) {
    return NextResponse.json({ 
      error: `Monthly showcase limit reached (${currentMonthCount}/${maxShowcases}). Upgrade to create more showcases.`,
      code: 'SHOWCASE_LIMIT_REACHED',
      currentCount: currentMonthCount,
      maxAllowed: maxShowcases,
      subscriptionTier
    }, { status: 403 });
  }

  // Validate media count
  if (!mediaIds || mediaIds.length < 1 || mediaIds.length > 6) {
    return NextResponse.json({ error: 'Showcase must contain between 1 and 6 media items' }, { status: 400 });
  }

  // Database constraint requires 3-6 media items, so duplicate items if needed
  let finalMediaIds = [...mediaIds];
  while (finalMediaIds.length < 3) {
    finalMediaIds.push(mediaIds[0]); // Duplicate the first item
  }

  // Get user profile ID
  const { data: userProfile, error: userProfileError } = await supabase
    .from('users_profile')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (userProfileError || !userProfile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Create a dummy gig first (since gig_id is required)
  // Use service key to bypass RLS for this internal operation
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: dummyGig, error: gigError } = await supabaseAdmin
    .from('gigs')
    .insert({
      owner_user_id: userProfile.id,
      title: 'Showcase Collection',
      description: 'Collection of showcase items',
      comp_type: 'TFP',
      location_text: 'Virtual',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
      application_deadline: new Date().toISOString(),
      max_applicants: 1,
      usage_rights: 'Portfolio use only',
      safety_notes: 'Virtual showcase',
      status: 'DRAFT'
    })
    .select()
    .single();

  if (gigError) {
    console.error('Error creating dummy gig:', gigError);
    return NextResponse.json({ error: 'Failed to create showcase context' }, { status: 500 });
  }

  // Filter out empty tags and validate
  const validTags = (tags || []).filter((tag: string) => tag && tag.trim().length > 0).map((tag: string) => tag.trim());
  
  console.log('Showcase creation data:', {
    title,
    description,
    type,
    mediaIds: finalMediaIds,
    tags: validTags,
    originalTags: tags,
    visibility,
    gigId: dummyGig.id,
    creatorUserId: userProfile.id
  });
  
  // Additional validation for tags
  if (validTags.length > 0) {
    console.log('Tags validation:', {
      validTags,
      tagsType: typeof tags,
      tagsIsArray: Array.isArray(tags),
      tagsLength: tags?.length
    });
  }

  const showcaseData = {
    gig_id: dummyGig.id,
    creator_user_id: userProfile.id,
    talent_user_id: userProfile.id, // For now, same as creator
    media_ids: finalMediaIds,
    caption: description || '',
    tags: validTags,
    palette: null,
    visibility: visibility === 'public' ? 'PUBLIC' : 'PRIVATE'
  };

  // Use service key to bypass RLS for showcase creation (reuse existing supabaseAdmin)
  const { data: showcase, error: showcaseError } = await supabaseAdmin
    .from('showcases')
    .insert(showcaseData)
    .select()
    .single();

  if (showcaseError) {
    console.error('Error creating showcase:', showcaseError);
    console.error('Showcase data that failed:', showcaseData);
    return NextResponse.json({ error: 'Failed to create showcase', details: showcaseError }, { status: 500 });
  }

  return NextResponse.json({ showcase });
  
  } catch (error) {
    console.error('Error in showcases POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
