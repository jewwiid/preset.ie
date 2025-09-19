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
    const { liked } = await request.json();

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get user profile ID
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (liked) {
      // Add like
      const { error: insertError } = await supabase
        .from('preset_likes')
        .upsert({
          preset_id: id,
          user_id: profile.id,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'preset_id,user_id'
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return NextResponse.json(
          { error: 'Failed to like preset' },
          { status: 500 }
        );
      }
    } else {
      // Remove like
      const { error: deleteError } = await supabase
        .from('preset_likes')
        .delete()
        .eq('preset_id', id)
        .eq('user_id', profile.id);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json(
          { error: 'Failed to unlike preset' },
          { status: 500 }
        );
      }
    }

    // Get updated like count
    const { count: likeCount, error: countError } = await supabase
      .from('preset_likes')
      .select('*', { count: 'exact', head: true })
      .eq('preset_id', id);

    if (countError) {
      console.error('Error getting like count:', countError);
    }

    return NextResponse.json({
      liked,
      likeCount: likeCount || 0
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
