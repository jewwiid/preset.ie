import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { getUserFromRequest } from '../../../../../lib/auth-utils';

/**
 * SIMPLIFIED ANALYTICS
 * - Just total views and unique visitors
 * - Last viewed timestamp
 * - No complex aggregations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const treatmentId = resolvedParams.id;

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Verify treatment ownership
    const { data: treatment, error: treatmentError } = await supabase
      .from('treatments')
      .select('owner_id, title')
      .eq('id', treatmentId)
      .single();

    if (treatmentError || !treatment) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    if (treatment.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Simple count query
    const { count, error: countError } = await supabase
      .from('treatment_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('treatment_id', treatmentId);

    if (countError) {
      console.error('Error fetching count:', countError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get last viewed timestamp
    const { data: lastView, error: lastViewError } = await supabase
      .from('treatment_analytics')
      .select('created_at')
      .eq('treatment_id', treatmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      treatment: {
        id: treatmentId,
        title: treatment.title
      },
      totalViews: count || 0,
      lastViewedAt: lastView?.created_at || null
    });
  } catch (error) {
    console.error('Error in analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

