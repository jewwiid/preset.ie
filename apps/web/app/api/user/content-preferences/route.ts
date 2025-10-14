import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's content preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's content preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_content_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new users
      console.error('Error fetching content preferences:', preferencesError);
      return NextResponse.json(
        { error: 'Failed to fetch content preferences' },
        { status: 500 }
      );
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      allow_nsfw_content: false,
      show_nsfw_warnings: true,
      auto_hide_nsfw: true,
      content_filter_level: 'moderate' as const,
      blocked_categories: [],
    };

    return NextResponse.json(preferences || defaultPreferences);
  } catch (error) {
    console.error('Content preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user's content preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      allow_nsfw_content,
      show_nsfw_warnings,
      auto_hide_nsfw,
      content_filter_level,
      blocked_categories,
    } = body;

    // Validate input
    if (typeof allow_nsfw_content !== 'boolean') {
      return NextResponse.json(
        { error: 'allow_nsfw_content must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof show_nsfw_warnings !== 'boolean') {
      return NextResponse.json(
        { error: 'show_nsfw_warnings must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof auto_hide_nsfw !== 'boolean') {
      return NextResponse.json(
        { error: 'auto_hide_nsfw must be a boolean' },
        { status: 400 }
      );
    }

    if (content_filter_level && !['strict', 'moderate', 'lenient'].includes(content_filter_level)) {
      return NextResponse.json(
        { error: 'content_filter_level must be strict, moderate, or lenient' },
        { status: 400 }
      );
    }

    if (blocked_categories && !Array.isArray(blocked_categories)) {
      return NextResponse.json(
        { error: 'blocked_categories must be an array' },
        { status: 400 }
      );
    }

    // Upsert user preferences
    const { data, error } = await supabase
      .from('user_content_preferences')
      .upsert({
        user_id: user.id,
        allow_nsfw_content,
        show_nsfw_warnings,
        auto_hide_nsfw,
        content_filter_level: content_filter_level || 'moderate',
        blocked_categories: blocked_categories || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating content preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update content preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Content preferences PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
