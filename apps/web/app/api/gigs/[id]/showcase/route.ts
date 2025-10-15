import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params;
    
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
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
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const { 
      title, 
      description, 
      mediaIds, 
      tags = [],
      caption 
    } = requestBody;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!mediaIds || mediaIds.length < 3 || mediaIds.length > 6) {
      return NextResponse.json(
        { success: false, error: 'Showcase must contain between 3 and 6 media items' },
        { status: 400 }
      );
    }

    // 1. Verify gig is completed
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single();

    if (gigError || !gig) {
      return NextResponse.json(
        { success: false, error: 'Gig not found' },
        { status: 404 }
      );
    }

    if (gig.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Can only create showcases for completed gigs' },
        { status: 400 }
      );
    }

    // 2. Verify user is gig creator
    if (gig.owner_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the gig creator can create showcases' },
        { status: 403 }
      );
    }

    // 3. Get talent user ID from accepted applications
    const { data: acceptedApplication, error: appError } = await supabase
      .from('applications')
      .select('applicant_user_id')
      .eq('gig_id', gigId)
      .eq('status', 'ACCEPTED')
      .single();

    if (appError || !acceptedApplication) {
      return NextResponse.json(
        { success: false, error: 'No accepted talent found for this gig' },
        { status: 400 }
      );
    }

    // 4. Verify media belongs to user and tag with source info
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    for (const mediaId of mediaIds) {
      const { data: media, error: mediaError } = await supabaseAdmin
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (mediaError || !media) {
        return NextResponse.json(
          { success: false, error: `Media ${mediaId} not found` },
          { status: 400 }
        );
      }

      if (media.owner_user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: `You don't own media ${mediaId}` },
          { status: 403 }
        );
      }

      // Update media with gig source tagging
      const updatedExif = {
        ...media.exif_json,
        source_type: 'custom',
        gig_id: gigId,
        uploaded_by: user.id,
        uploaded_for_showcase: true
      };

      await supabaseAdmin
        .from('media')
        .update({ exif_json: updatedExif })
        .eq('id', mediaId);
    }

    // 5. Create showcase with from_gig=true, approval_status='draft'
    const showcaseData = {
      title,
      description: description || caption || '',
      creator_user_id: user.id,
      talent_user_id: acceptedApplication.applicant_user_id,
      gig_id: gigId,
      media_ids: mediaIds,
      tags,
      from_gig: true,
      approval_status: 'draft',
      visibility: 'private', // Start as private until approved
      likes_count: 0,
      views_count: 0,
      media_count: mediaIds.length
    };

    const { data: newShowcase, error: showcaseError } = await supabaseAdmin
      .from('showcases')
      .insert(showcaseData)
      .select()
      .single();

    if (showcaseError) {
      console.error('Error creating showcase:', showcaseError);
      return NextResponse.json(
        { success: false, error: 'Failed to create showcase' },
        { status: 500 }
      );
    }

    // Create showcase media entries
    const mediaEntries = mediaIds.map((mediaId: string, index: number) => ({
      showcase_id: newShowcase.id,
      media_id: mediaId,
      order_index: index,
      created_at: new Date().toISOString()
    }));

    const { error: mediaError } = await supabaseAdmin
      .from('showcase_media')
      .insert(mediaEntries);

    if (mediaError) {
      console.error('Error creating showcase media:', mediaError);
      // Don't fail the entire request, just log the error
    }

    return NextResponse.json({
      success: true,
      showcase: newShowcase
    });

  } catch (error) {
    console.error('Create gig showcase API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
