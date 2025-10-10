import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get all users with their profiles
    const { data: users, error } = await supabaseAdmin
      .from('users_profile')
      .select(`
        user_id,
        first_name,
        last_name,
        display_name,
        handle,
        bio,
        city,
        country,
        role_flags,
        availability_status,
        email_verified,
        created_at,
        updated_at
      `);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // For each user, get their email from auth.users
    const enrichedUsers = [];
    
    for (const user of users || []) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.user_id);
        
        if (authError || !authUser.user) {
          console.warn(`Could not fetch auth data for user ${user.user_id}:`, authError);
          continue;
        }

        enrichedUsers.push({
          user_id: user.user_id,
          email: authUser.user.email,
          email_verified: !!authUser.user.email_confirmed_at,
          first_name: user.first_name,
          last_name: user.last_name,
          display_name: user.display_name,
          handle: user.handle,
          bio: user.bio,
          city: user.city,
          country: user.country,
          role_flags: user.role_flags,
          availability_status: user.availability_status,
          profile_created_at: user.created_at,
          profile_updated_at: user.updated_at,
          auth_created_at: authUser.user.created_at
        });
      } catch (err) {
        console.warn(`Error processing user ${user.user_id}:`, err);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      total: enrichedUsers.length
    });

  } catch (error) {
    console.error('Export users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
