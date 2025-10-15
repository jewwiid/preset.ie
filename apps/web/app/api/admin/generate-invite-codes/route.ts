import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/generate-invite-codes
 * Generate multiple admin invite codes
 * Body: { count: number, expiresInDays?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
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
    const { count = 5, expiresInDays = 90 } = body;

    // Validate count
    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Generate codes
    const generatedCodes = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    for (let i = 0; i < count; i++) {
      // Call the database function to generate a unique code
      const { data: newCode, error: codeError } = await supabase
        .rpc('generate_invite_code');

      if (codeError || !newCode) {
        console.error('Error generating code:', codeError);
        continue;
      }

      // Insert the code
      const { data: insertedCode, error: insertError } = await supabase
        .from('invite_codes')
        .insert({
          code: newCode,
          created_by_user_id: null, // Admin codes have no creator
          status: 'active',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (!insertError && insertedCode) {
        generatedCodes.push(insertedCode);
      }
    }

    if (generatedCodes.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any codes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedCodes.length} invite codes`,
      codes: generatedCodes.map(code => ({
        code: code.code,
        expires_at: code.expires_at,
        created_at: code.created_at
      })),
      count: generatedCodes.length
    });

  } catch (error) {
    console.error('Generate invite codes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
