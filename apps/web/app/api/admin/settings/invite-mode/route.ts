import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/settings/invite-mode
 * Get the current invite-only mode status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the invite_only_mode setting
    const { data: setting, error: settingError } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('key', 'invite_only_mode')
      .single();

    if (settingError) {
      console.error('Error fetching invite mode setting:', settingError);
      return NextResponse.json(
        { error: 'Failed to fetch invite mode setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enabled: setting.value,
      updated_at: setting.updated_at,
      updated_by: setting.updated_by
    });

  } catch (error) {
    console.error('Invite mode GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/invite-mode
 * Toggle the invite-only mode on or off
 * Body: { enabled: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile ID
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, account_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Update the setting
    const { data: updatedSetting, error: updateError } = await supabase
      .from('platform_settings')
      .update({
        value: enabled,
        updated_at: new Date().toISOString(),
        updated_by: profile.id
      })
      .eq('key', 'invite_only_mode')
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invite mode:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invite mode' },
        { status: 500 }
      );
    }

    // Log the action
    console.log(`Invite-only mode ${enabled ? 'enabled' : 'disabled'} by admin ${user.email}`);

    return NextResponse.json({
      success: true,
      enabled: updatedSetting.value,
      message: `Invite-only mode ${enabled ? 'enabled' : 'disabled'} successfully`,
      updated_at: updatedSetting.updated_at,
      updated_by: updatedSetting.updated_by
    });

  } catch (error) {
    console.error('Invite mode POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
