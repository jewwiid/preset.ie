import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const skill = searchParams.get('skill') || '';
    const role = searchParams.get('role') || ''; // TALENT or CONTRIBUTOR
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';
    const availableForTravel = searchParams.get('available_for_travel') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build the query
    let dbQuery = supabase
      .from('users_profile')
      .select('id, handle, display_name, avatar_url, primary_skill, role_flags, specializations, performance_roles, city, country, years_experience, available_for_travel')
      .in('account_status', ['active', 'pending_verification'])
      .not('avatar_url', 'is', null)
      .eq('allow_collaboration_invites', true);

    // Filter by search query (handle or display name)
    if (query.trim()) {
      dbQuery = dbQuery.or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`);
    }

    // Filter by primary skill
    if (skill.trim()) {
      dbQuery = dbQuery.ilike('primary_skill', skill);
    }

    // Filter by role flags (TALENT or CONTRIBUTOR)
    if (role.trim()) {
      dbQuery = dbQuery.contains('role_flags', [role]);
    }

    // Filter by city (case-insensitive)
    if (city.trim()) {
      dbQuery = dbQuery.ilike('city', city);
    }

    // Filter by country (case-insensitive)
    if (country.trim()) {
      dbQuery = dbQuery.ilike('country', country);
    }

    // Filter by available for travel
    if (availableForTravel) {
      dbQuery = dbQuery.eq('available_for_travel', true);
    }

    // Exclude admin profiles (using PostgreSQL array contains operator)
    dbQuery = dbQuery.not('role_flags', 'cs', '{"ADMIN"}');

    // Order by profile completion and limit
    dbQuery = dbQuery
      .order('profile_completion_percentage', { ascending: false })
      .limit(limit);

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
