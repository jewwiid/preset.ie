import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '8';
    const role = searchParams.get('role'); // 'TALENT' or 'CONTRIBUTOR'

    // Fetch public talent profiles from the database
    const { data, error } = await supabase
      .from('users_profile')
      .select(`
        id,
        user_id,
        display_name,
        handle,
        avatar_url,
        bio,
        city,
        country,
        role_flags,
        style_tags,
        vibe_tags,
        specializations,
        talent_categories,
        years_experience,
        account_status,
        profile_completion_percentage,
        created_at
      `)
      .in('account_status', ['active', 'pending_verification']) // Active or pending verification accounts
      .gte('profile_completion_percentage', 0) // Any profile completion level
      .not('avatar_url', 'is', null) // Must have avatar
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) * 2); // Get more to filter by role

    if (error) {
      console.error('Error fetching talent profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch talent profiles' }, { status: 500 });
    }

    // Filter out admin profiles and by role if specified
    let publicProfiles = (data || []).filter(profile =>
      !profile.role_flags || !profile.role_flags.includes('ADMIN')
    );

    // Filter by role if specified
    if (role) {
      publicProfiles = publicProfiles.filter(profile =>
        profile.role_flags && (
          profile.role_flags.includes(role) ||
          profile.role_flags.includes('BOTH')
        )
      );
    }

    // Limit results after filtering
    publicProfiles = publicProfiles.slice(0, parseInt(limit));

    return NextResponse.json(publicProfiles);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
