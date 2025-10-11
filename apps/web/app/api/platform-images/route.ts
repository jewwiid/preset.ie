import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Fetch platform images from the database
    let query = supabase
      .from('platform_images')
      .select('*')
      .order('display_order', { ascending: true });

    // Only filter by is_active if includeInactive is false (default behavior)
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching platform images:', error);
      return NextResponse.json({ error: 'Failed to fetch platform images' }, { status: 500 });
    }

    // Return in format expected by admin page
    return NextResponse.json({ images: data || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}