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

    // Fetch from both contributor roles and talent categories
    const [contributorResult, talentResult] = await Promise.all([
      supabase
        .from('predefined_roles')
        .select('id, name, sort_order')
        .eq('is_active', true)
        .order('sort_order')
        .order('name'),
      supabase
        .from('predefined_talent_categories')
        .select('id, category_name, sort_order')
        .eq('is_active', true)
        .order('sort_order')
        .order('category_name')
    ]);

    if (contributorResult.error) {
      console.error('Error fetching contributor roles:', contributorResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch contributor roles' },
        { status: 500 }
      );
    }

    if (talentResult.error) {
      console.error('Error fetching talent categories:', talentResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch talent categories' },
        { status: 500 }
      );
    }

    // Combine both types of roles
    const allRoles = [
      ...(contributorResult.data || []).map(role => ({
        id: role.id,
        name: role.name,
        sort_order: role.sort_order,
        type: 'contributor' as const
      })),
      ...(talentResult.data || []).map(role => ({
        id: role.id,
        name: role.category_name,
        sort_order: role.sort_order,
        type: 'talent' as const
      }))
    ];

    // Filter by category if specified
    const filteredRoles = category 
      ? allRoles.filter(role => role.type === category)
      : allRoles;

    return NextResponse.json({ roles: filteredRoles });
  } catch (error) {
    console.error('Error in roles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
