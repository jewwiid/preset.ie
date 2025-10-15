import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '4'; // Changed default to 4
    const role = searchParams.get('role'); // 'TALENT' or 'CONTRIBUTOR'

    // Fetch verified and paid member profiles from the database
    // First, get verification badges to find verified users
    const { data: verifiedUsers, error: badgeError } = await supabase
      .from('verification_badges')
      .select('user_id')
      .is('revoked_at', null); // Only active verifications

    if (badgeError) {
      console.error('Error fetching verification badges:', badgeError);
      return NextResponse.json({ error: 'Failed to fetch verification badges' }, { status: 500 });
    }

    const verifiedUserIds = verifiedUsers?.map(v => v.user_id) || [];

    // Get paid members (non-free tier)
    const { data: paidUsers, error: creditError } = await supabase
      .from('user_credits')
      .select('user_id, subscription_tier')
      .neq('subscription_tier', 'free');

    if (creditError) {
      console.error('Error fetching paid users:', creditError);
      return NextResponse.json({ error: 'Failed to fetch paid users' }, { status: 500 });
    }

    const paidUserIds = paidUsers?.map(u => u.user_id) || [];

    // Combine verified and paid user IDs (users who are either verified OR paid OR both)
    const eligibleUserIds = [...new Set([...verifiedUserIds, ...paidUserIds])];

    if (eligibleUserIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch profiles for eligible users (verified or paid)
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
        account_type,
        style_tags,
        vibe_tags,
        professional_skills,
        years_experience,
        account_status,
        profile_completion_percentage,
        verified_id,
        created_at
      `)
      .in('user_id', eligibleUserIds)
      .eq('account_status', 'active') // Only active accounts
      .gte('profile_completion_percentage', 50) // At least 50% complete profile

    if (error) {
      console.error('Error fetching talent profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch talent profiles' }, { status: 500 });
    }

    // Filter out admin profiles and by role if specified
    let publicProfiles = (data || []).filter(profile =>
      !profile.account_type || !profile.account_type.includes('ADMIN')
    );

    // Filter by role if specified
    if (role) {
      publicProfiles = publicProfiles.filter(profile =>
        profile.account_type && (
          profile.account_type.includes(role) ||
          profile.account_type.includes('BOTH')
        )
      );
    }

    // Randomize the profiles for variety on each page load
    const shuffled = publicProfiles.sort(() => Math.random() - 0.5);

    // Limit results after filtering and shuffling
    const selectedProfiles = shuffled.slice(0, parseInt(limit));

    // Add fallback avatar and fetch verification badges for each profile
    const profilesWithAvatars = await Promise.all(selectedProfiles.map(async (profile) => {
      // Fetch verification badges for this user
      const { data: badges } = await supabase
        .from('verification_badges')
        .select('*')
        .eq('user_id', profile.user_id)
        .is('revoked_at', null);

      return {
        ...profile,
        avatar_url: profile.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/presetie_logo.png',
        verification_badges: badges || []
      };
    }));

    return NextResponse.json(profilesWithAvatars);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
