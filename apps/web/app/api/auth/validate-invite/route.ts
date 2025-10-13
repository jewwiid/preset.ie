import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/validate-invite
 * Validate an invite code
 * Body: { code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse request body
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: code is required', valid: false },
        { status: 400 }
      );
    }

    // Normalize code to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Check if invite-only mode is active
    const { data: setting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'invite_only_mode')
      .single();

    const inviteOnlyMode = setting?.value ?? false;

    if (!inviteOnlyMode) {
      // If invite-only mode is off, codes are not required
      return NextResponse.json({
        valid: true,
        required: false,
        message: 'Invite code not required - open signups enabled'
      });
    }

    // Look up the invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from('invite_codes')
      .select(`
        id,
        code,
        status,
        used_by_user_id,
        expires_at,
        created_by_user_id,
        created_at
      `)
      .eq('code', normalizedCode)
      .single();

    if (codeError || !inviteCode) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invite code',
        message: 'This invite code does not exist'
      }, { status: 400 });
    }

    // Check if code is already used
    if (inviteCode.status === 'used') {
      return NextResponse.json({
        valid: false,
        error: 'Invite code already used',
        message: 'This invite code has already been used'
      }, { status: 400 });
    }

    // Check if code is expired
    if (inviteCode.status === 'expired' ||
        (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date())) {
      return NextResponse.json({
        valid: false,
        error: 'Invite code expired',
        message: 'This invite code has expired'
      }, { status: 400 });
    }

    // Code is valid
    return NextResponse.json({
      valid: true,
      required: true,
      code: inviteCode.code,
      inviteCodeId: inviteCode.id,
      message: 'Invite code is valid'
    });

  } catch (error) {
    console.error('Validate invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/validate-invite
 * Check if invite-only mode is active
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if invite-only mode is active
    const { data: setting, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'invite_only_mode')
      .single();

    if (error) {
      console.error('Error checking invite mode:', error);
      return NextResponse.json({
        inviteOnlyMode: false,
        error: 'Could not determine invite mode status'
      });
    }

    return NextResponse.json({
      inviteOnlyMode: setting?.value ?? false
    });

  } catch (error) {
    console.error('Check invite mode error:', error);
    return NextResponse.json(
      { error: 'Internal server error', inviteOnlyMode: false },
      { status: 500 }
    );
  }
}
