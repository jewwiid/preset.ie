import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Remove duplicate roles that belong in talent categories
    const duplicateRoles = ['Musician', 'Content Creator', 'Influencer'];
    
    const { data: deletedRoles, error: deleteError } = await supabase
      .from('predefined_roles')
      .delete()
      .in('name', duplicateRoles)
      .select('name');

    if (deleteError) {
      console.error('Error deleting duplicate roles:', deleteError);
      return NextResponse.json({ error: 'Failed to delete duplicate roles' }, { status: 500 });
    }

    // Get counts after cleanup
    const { count: contributorCount } = await supabase
      .from('predefined_roles')
      .select('*', { count: 'exact', head: true });

    const { count: talentCount } = await supabase
      .from('predefined_talent_categories')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      deletedRoles: deletedRoles?.map(r => r.name) || [],
      counts: {
        contributorRoles: contributorCount || 0,
        talentCategories: talentCount || 0,
        total: (contributorCount || 0) + (talentCount || 0)
      }
    });

  } catch (error) {
    console.error('Error in fix-role-duplicates API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
