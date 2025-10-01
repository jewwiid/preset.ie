import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET /api/collab/predefined/roles
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('predefined_roles')
      .select('id, name, category, description, sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: roles, error } = await query;

    if (error) {
      console.error('Error fetching predefined roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error in roles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
