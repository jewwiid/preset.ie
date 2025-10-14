import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's custom types + suggested types
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

    // Fetch user's custom types
    const { data: userTypes, error: userTypesError } = await supabase
      .from('user_image_type_library')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('last_used_at', { ascending: false });

    if (userTypesError) {
      console.error('Error fetching user types:', userTypesError);
      return NextResponse.json(
        { error: 'Failed to fetch custom types' },
        { status: 500 }
      );
    }

    // Fetch approved suggested types
    const { data: suggestedTypes, error: suggestedTypesError } = await supabase
      .from('suggested_image_types')
      .select('*')
      .eq('is_approved', true)
      .order('usage_count', { ascending: false });

    if (suggestedTypesError) {
      console.error('Error fetching suggested types:', suggestedTypesError);
      return NextResponse.json(
        { error: 'Failed to fetch suggested types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userTypes: userTypes || [],
      suggestedTypes: suggestedTypes || [],
    });
  } catch (error) {
    console.error('Custom types API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save new custom type
export async function POST(request: NextRequest) {
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
    const { type_label, description, is_nsfw } = body;

    // Validate input
    if (!type_label || typeof type_label !== 'string' || type_label.trim().length === 0) {
      return NextResponse.json(
        { error: 'Type label is required' },
        { status: 400 }
      );
    }

    if (type_label.length > 50) {
      return NextResponse.json(
        { error: 'Type label must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Basic NSFW keyword detection (client-side validation)
    const nsfwKeywords = [
      'adult', 'explicit', 'nude', 'naked', 'sex', 'sexual', 'porn', 'pornography',
      'fetish', 'bdsm', 'kink', 'erotic', 'sensual', 'intimate', 'provocative',
      'lingerie', 'underwear', 'bra', 'panties', 'thong', 'bikini', 'swimsuit',
      'breast', 'boob', 'ass', 'butt', 'penis', 'dick', 'cock', 'vagina', 'pussy',
      'masturbation', 'orgasm', 'cum', 'sperm', 'ejaculation', 'climax',
      'strip', 'stripper', 'escort', 'prostitute', 'hooker', 'whore',
      'rape', 'molest', 'abuse', 'incest', 'pedophile', 'child porn',
      'violence', 'gore', 'blood', 'torture', 'murder', 'kill', 'death',
      'hate', 'racist', 'discrimination', 'slur', 'offensive'
    ];

    const textToCheck = `${type_label} ${description || ''}`.toLowerCase();
    const detectedNsfw = nsfwKeywords.some(keyword => textToCheck.includes(keyword));
    
    // Use client-provided is_nsfw flag or auto-detected value
    const finalIsNsfw = is_nsfw !== undefined ? is_nsfw : detectedNsfw;

    // Insert or update (increment usage count if exists)
    const { data: existingType, error: checkError } = await supabase
      .from('user_image_type_library')
      .select('id, usage_count')
      .eq('user_id', user.id)
      .eq('type_label', type_label.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new types
      console.error('Error checking existing type:', checkError);
      return NextResponse.json(
        { error: 'Failed to check custom type' },
        { status: 500 }
      );
    }

    if (existingType) {
      // Update existing type
      const { data, error } = await supabase
        .from('user_image_type_library')
        .update({
          description: description || null,
          is_nsfw: finalIsNsfw,
          moderation_status: finalIsNsfw ? 'flagged' : 'approved',
          usage_count: (existingType.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingType.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating custom type:', error);
        return NextResponse.json(
          { error: 'Failed to update custom type' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data, message: 'Custom type updated' });
    } else {
      // Insert new type
      const { data, error } = await supabase
        .from('user_image_type_library')
        .insert({
          user_id: user.id,
          type_label: type_label.trim(),
          description: description || null,
          is_nsfw: finalIsNsfw,
          moderation_status: finalIsNsfw ? 'flagged' : 'approved',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating custom type:', error);
        return NextResponse.json(
          { error: 'Failed to create custom type' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data, message: 'Custom type created' }, { status: 201 });
    }
  } catch (error) {
    console.error('Custom types POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom type
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('id');

    if (!typeId) {
      return NextResponse.json(
        { error: 'Type ID is required' },
        { status: 400 }
      );
    }

    // Delete the type (RLS will ensure only user's own types can be deleted)
    const { error } = await supabase
      .from('user_image_type_library')
      .delete()
      .eq('id', typeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting custom type:', error);
      return NextResponse.json(
        { error: 'Failed to delete custom type' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Custom type deleted' });
  } catch (error) {
    console.error('Custom types DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

