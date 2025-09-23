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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
    mediaMetadata
  } = await request.json();

  // Check subscription tier and monthly limits
  const { data: profile, error: profileError } = await supabase
    .from('users_profile')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
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
  if (!mediaIds || mediaIds.length === 0 || mediaIds.length > 6) {
    return NextResponse.json({ error: 'Showcase must contain between 1 and 6 media items' }, { status: 400 });
  }

  // Create showcase with metadata
  const showcaseData = {
    title,
    description,
    type,
    creator_user_id: user.id,
    tags: tags || [],
    moodboard_summary: null,
    moodboard_palette: null,
    visibility: 'PUBLIC',
    metadata: {
      media_count: mediaIds.length,
      media_metadata: mediaMetadata || [],
      created_via: 'web_app'
    }
  };

  const { data: showcase, error: showcaseError } = await supabase
    .from('showcases')
    .insert(showcaseData)
    .select()
    .single();

  if (showcaseError) {
    console.error('Error creating showcase:', showcaseError);
    return NextResponse.json({ error: 'Failed to create showcase' }, { status: 500 });
  }

  // Add media to showcase
  const mediaInserts = mediaIds.map((mediaId: string, index: number) => ({
    showcase_id: showcase.id,
    media_id: mediaId,
    sort_order: index
  }));

  const { error: mediaError } = await supabase
    .from('showcase_media')
    .insert(mediaInserts);

  if (mediaError) {
    console.error('Error adding media to showcase:', mediaError);
    // Clean up the showcase if media insertion fails
    await supabase.from('showcases').delete().eq('id', showcase.id);
    return NextResponse.json({ error: 'Failed to add media to showcase' }, { status: 500 });
  }

  return NextResponse.json({ showcase });
  
  } catch (error) {
    console.error('Error in showcases POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
