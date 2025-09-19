import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from authorization header (optional for usage tracking)
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Verify user token and get user ID
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        userId = profile?.id;
      }
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Increment usage count
    const { error: updateError } = await supabase.rpc('increment_preset_usage', {
      preset_id: id
    });

    if (updateError) {
      console.error('Error incrementing usage:', updateError);
      return NextResponse.json(
        { error: 'Failed to track usage' },
        { status: 500 }
      );
    }

    // Track individual usage if user is authenticated
    if (userId) {
      const { error: insertError } = await supabase
        .from('preset_usage')
        .insert({
          preset_id: id,
          user_id: userId,
          used_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error tracking individual usage:', insertError);
        // Don't fail the request if individual tracking fails
      }
    }

    return NextResponse.json({
      message: 'Usage tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
