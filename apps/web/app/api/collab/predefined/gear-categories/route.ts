import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = supabase.from('predefined_gear_categories').select('*').eq('is_active', true);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('sort_order', { ascending: true }).order('name', { ascending: true });

  if (error) {
    console.error('Error fetching predefined gear categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gearCategories: data });
}
