import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    // Fetch platform images from the database
    const { data, error } = await supabase
      .from('platform_images')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching platform images:', error);
      return NextResponse.json({ error: 'Failed to fetch platform images' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}