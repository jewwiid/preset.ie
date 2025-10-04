import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PUT(
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

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user from the request headers (set by middleware)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Extract user ID from the auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { new_handle, display_name, bio, city } = body;

    // Validate new handle if provided
    if (new_handle) {
      // Check handle format
      if (!/^[a-z0-9_]{3,30}$/.test(new_handle)) {
        return NextResponse.json(
          { error: 'Handle must be 3-30 characters, lowercase letters, numbers, and underscores only' },
          { status: 400 }
        );
      }

      // Check if new handle is available
      const { data: existingProfile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('handle', new_handle)
        .neq('user_id', user.id) // Exclude current user
        .single();

      if (existingProfile) {
        return NextResponse.json(
          { error: 'Handle is already taken' },
          { status: 409 }
        );
      }
    }

    // Get current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching current profile:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (new_handle !== undefined) updateData.handle = new_handle;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users_profile')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      redirect_needed: new_handle && new_handle !== currentProfile.handle
    }, { status: 200 });

  } catch (error: any) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
