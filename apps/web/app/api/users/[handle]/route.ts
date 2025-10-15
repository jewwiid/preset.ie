import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    
    if (!handle) {
      return NextResponse.json(
        { error: 'Handle parameter is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch public profile by handle
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select(`
        id,
        user_id,
        display_name,
        handle,
        bio,
        avatar_url,
        city,
        country,
        account_type,
        style_tags,
        verified_id,
        created_at,
        updated_at,
        years_experience,
        specializations,
        equipment_list,
        editing_software,
        languages,
        portfolio_url,
        website_url,
        instagram_handle,
        tiktok_handle,
        hourly_rate_min,
        hourly_rate_max,
        available_for_travel,
        has_studio,
        studio_name
      `)
      .eq('handle', handle)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Fetch public showcases for this user
    const { data: showcases, error: showcasesError } = await supabase
      .from('showcases')
      .select(`
        id,
        caption,
        tags,
        visibility,
        created_at,
        approved_by_creator_at,
        approved_by_talent_at,
        gig:gigs!showcases_gig_id_fkey (
          id,
          title,
          location_text
        )
      `)
      .eq('visibility', 'PUBLIC')
      .or(`creator_user_id.eq.${profile.id},talent_user_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (showcasesError) {
      console.error('Error fetching showcases:', showcasesError);
      // Don't fail the entire request if showcases fail
    }

    // Fetch public gigs created by this user
    const { data: createdGigs, error: gigsError } = await supabase
      .from('gigs')
      .select(`
        id,
        title,
        description,
        location_text,
        comp_type,
        status,
        created_at
      `)
      .eq('creator_user_id', profile.id)
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })
      .limit(10);

    if (gigsError) {
      console.error('Error fetching gigs:', gigsError);
      // Don't fail the entire request if gigs fail
    }

    // Get user stats
    const stats = {
      showcases_count: showcases?.length || 0,
      gigs_created: createdGigs?.length || 0,
      member_since: profile.created_at
    };

    return NextResponse.json({
      profile,
      showcases: showcases || [],
      createdGigs: createdGigs || [],
      stats
    });

  } catch (error: any) {
    console.error('Public profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
